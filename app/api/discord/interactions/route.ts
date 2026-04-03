// Discord Interactions endpoint — handles slash commands sent by Discord.
// Register the Interactions Endpoint URL in the Discord Developer Portal:
//   https://<your-domain>/api/discord/interactions
//
// Commands: /profil  /topplista  /quests
// Run `npx tsx scripts/register-discord-commands.ts` once to register commands.

import { NextRequest, NextResponse } from "next/server";
import { createPublicKey, verify as cryptoVerify } from "crypto";
import { prisma } from "@/lib/prisma";
import { levelProgress } from "@/lib/gamification";
import { getActiveQuests, getWeekIndex } from "@/lib/weekly-quests";

// ─── Signature verification (Ed25519 via Node crypto) ─────────────────────────
// Discord signs requests with Ed25519. We reconstruct the public key in SPKI/DER
// format (12-byte ASN.1 header + 32 raw key bytes) so Node's built-in crypto can
// verify without any extra packages.

const ED25519_DER_PREFIX = Buffer.from("302a300506032b6570032100", "hex");

function verifySignature(
  publicKeyHex: string,
  signature: string,
  timestamp: string,
  body: string
): boolean {
  try {
    const rawKey = Buffer.from(publicKeyHex, "hex");
    const derKey = Buffer.concat([ED25519_DER_PREFIX, rawKey]);
    const publicKey = createPublicKey({ key: derKey, format: "der", type: "spki" });
    const message = Buffer.from(timestamp + body);
    const sig = Buffer.from(signature, "hex");
    return cryptoVerify(null, message, publicKey, sig);
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

  const valid = verifySignature(publicKey, signature, timestamp, body);
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
