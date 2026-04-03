// Discord Interactions endpoint — handles slash commands sent by Discord.
// Register the Interactions Endpoint URL in the Discord Developer Portal:
//   https://<your-domain>/api/discord/interactions
//
// Commands: /profil  /topplista  /quests
// Run `npx tsx scripts/register-discord-commands.ts` once to register commands.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { levelProgress } from "@/lib/gamification";
import { getActiveQuests, getWeekIndex } from "@/lib/weekly-quests";

// ─── Signature verification (Ed25519) ─────────────────────────────────────────

function hexToUint8(hex: string): Uint8Array<ArrayBuffer> {
  const buf = new ArrayBuffer(hex.length / 2);
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

async function verifySignature(
  publicKeyHex: string,
  signature: string,
  timestamp: string,
  body: string
): Promise<boolean> {
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      hexToUint8(publicKeyHex),
      { name: "Ed25519" },
      false,
      ["verify"]
    );
    return await crypto.subtle.verify(
      "Ed25519",
      key,
      hexToUint8(signature),
      new TextEncoder().encode(timestamp + body)
    );
  } catch {
    return false;
  }
}

// ─── Response helpers ─────────────────────────────────────────────────────────

type DiscordEmbed = Record<string, unknown>;

function cmdResponse(data: object) {
  return NextResponse.json({ type: 4, data });
}

function ephemeral(content: string) {
  return cmdResponse({ content, flags: 64 });
}

function progressBar(percent: number): string {
  const filled = Math.round(percent / 10);
  return "█".repeat(filled) + "░".repeat(10 - filled);
}

// ─── /profil ──────────────────────────────────────────────────────────────────

async function handleProfil(discordUserId: string): Promise<NextResponse> {
  const user = await prisma.user.findFirst({
    where: { discordId: discordUserId },
    select: {
      name: true,
      xp: true,
      level: true,
      streak: true,
      tier: true,
      _count: { select: { forumPosts: true } },
    },
  });

  if (!user) {
    return ephemeral(
      "❌ Ditt Discord-konto är inte kopplat till SpelPoängen.\nLogga in på **spelpoangen.se** med Discord för att koppla kontot!"
    );
  }

  const { level, currentXP, requiredXP, percent } = levelProgress(user.xp);
  const bar = progressBar(percent);

  const embed: DiscordEmbed = {
    title: `${user.name ?? "Anonym"} — SpelPoängen Profil`,
    color: 0x00f5ff,
    fields: [
      { name: "🎮 Nivå", value: `**${level}**`, inline: true },
      { name: "⚡ Total XP", value: `${user.xp.toLocaleString("sv")}`, inline: true },
      { name: "🔥 Streak", value: `${user.streak} dagar`, inline: true },
      { name: "📝 Foruminlägg", value: `${user._count.forumPosts}`, inline: true },
      { name: "🏆 Tier", value: user.tier, inline: true },
      {
        name: `Framsteg: Nivå ${level} → ${level + 1}`,
        value: `\`${bar}\` ${percent}%\n${currentXP.toLocaleString("sv")} / ${requiredXP.toLocaleString("sv")} XP`,
        inline: false,
      },
    ],
    footer: { text: "spelpoangen.se" },
    timestamp: new Date().toISOString(),
  };

  return cmdResponse({ embeds: [embed] });
}

// ─── /topplista ───────────────────────────────────────────────────────────────

async function handleTopplista(): Promise<NextResponse> {
  const users = await prisma.user.findMany({
    orderBy: { xp: "desc" },
    take: 10,
    select: { name: true, xp: true, level: true },
  });

  const rows = users
    .map((u, i) => {
      const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `\`${i + 1}.\``;
      return `${medal} **${u.name ?? "Anonym"}** — Nivå ${u.level} • ${u.xp.toLocaleString("sv")} XP`;
    })
    .join("\n");

  const embed: DiscordEmbed = {
    title: "🏆 SpelPoängen Topplista",
    description: rows.length ? rows : "Inga spelare ännu.",
    color: 0xfacc15,
    footer: { text: "spelpoangen.se" },
    timestamp: new Date().toISOString(),
  };

  return cmdResponse({ embeds: [embed] });
}

// ─── /quests ─────────────────────────────────────────────────────────────────

async function handleQuests(discordUserId: string): Promise<NextResponse> {
  const user = await prisma.user.findFirst({
    where: { discordId: discordUserId },
    select: { id: true },
  });

  const activeQuests = getActiveQuests();
  const weekIndex = getWeekIndex();

  let claimedIds: string[] = [];
  if (user) {
    const claims = await prisma.userWeeklyQuestClaim.findMany({
      where: { userId: user.id, weekIndex },
      select: { questId: true },
    });
    claimedIds = claims.map((c) => c.questId);
  }

  const fields = activeQuests.map((q) => {
    const done = claimedIds.includes(q.id);
    return {
      name: `${done ? "✅" : "⏳"} ${q.title} — +${q.xp} XP`,
      value: q.description + (done ? "\n*Belöning hämtad!*" : ""),
      inline: false,
    };
  });

  const allDone = activeQuests.every((q) => claimedIds.includes(q.id));

  const embed: DiscordEmbed = {
    title: "📋 Veckans Utmaningar",
    description: allDone
      ? "🎉 Du har hämtat alla veckans belöningar! Kom tillbaka på måndag."
      : user
      ? "Dina aktiva quests den här veckan:"
      : "Logga in på spelpoangen.se med Discord för att se din progress!",
    color: allDone ? 0x34d399 : 0x00f5ff,
    fields,
    footer: { text: "Nollställs varje måndag  •  spelpoangen.se" },
    timestamp: new Date().toISOString(),
  };

  return cmdResponse({ embeds: [embed] });
}

// ─── Main POST handler ────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const publicKey = process.env.DISCORD_PUBLIC_KEY;
  if (!publicKey) {
    return NextResponse.json({ error: "DISCORD_PUBLIC_KEY not configured" }, { status: 500 });
  }

  // Read body as text so we can verify the signature before parsing JSON
  const body = await request.text();
  const signature = request.headers.get("x-signature-ed25519") ?? "";
  const timestamp = request.headers.get("x-signature-timestamp") ?? "";

  const valid = await verifySignature(publicKey, signature, timestamp, body);
  if (!valid) {
    return new NextResponse("Invalid request signature", { status: 401 });
  }

  const interaction = JSON.parse(body) as {
    type: number;
    data?: { name?: string };
    member?: { user?: { id?: string } };
    user?: { id?: string };
  };

  // Discord PING — must respond with PONG
  if (interaction.type === 1) {
    return NextResponse.json({ type: 1 });
  }

  // Slash commands
  if (interaction.type === 2) {
    const discordUserId = interaction.member?.user?.id ?? interaction.user?.id ?? "";
    const commandName = interaction.data?.name ?? "";

    switch (commandName) {
      case "profil":
        return handleProfil(discordUserId);
      case "topplista":
        return handleTopplista();
      case "quests":
        return handleQuests(discordUserId);
      default:
        return ephemeral("Okänt kommando.");
    }
  }

  return NextResponse.json({ type: 1 });
}
