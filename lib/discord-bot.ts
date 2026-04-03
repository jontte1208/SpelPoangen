// Discord REST API helpers — fire-and-forget notifications + role sync.
// All functions catch their own errors so they never break the calling request.

const DISCORD_API = "https://discord.com/api/v10";

function botHeaders() {
  return {
    Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
    "Content-Type": "application/json",
  };
}

async function sendToChannel(channelId: string, payload: object): Promise<void> {
  if (!process.env.DISCORD_BOT_TOKEN || !channelId) return;
  try {
    const res = await fetch(`${DISCORD_API}/channels/${channelId}/messages`, {
      method: "POST",
      headers: botHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error("[discord-bot] channel send failed:", await res.text());
    }
  } catch (e) {
    console.error("[discord-bot] network error:", e);
  }
}

// ─── Notifications ─────────────────────────────────────────────────────────────

export async function sendForumPostEmbed(post: {
  id: string;
  title: string;
  content: string;
  game: string | null;
  author: { name: string | null; image: string | null };
}): Promise<void> {
  const channelId = process.env.DISCORD_FORUM_CHANNEL_ID;
  if (!channelId) return;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://spelpoangen.se";
  const preview = post.content.length > 250 ? post.content.slice(0, 250) + "…" : post.content;
  const gameLabel = post.game ?? "Övrigt";

  await sendToChannel(channelId, {
    embeds: [
      {
        title: post.title,
        description: preview,
        url: `${appUrl}/forum/${post.id}`,
        color: 0x00f5ff,
        author: {
          name: post.author.name ?? "Anonym",
          ...(post.author.image ? { icon_url: post.author.image } : {}),
        },
        footer: { text: `📌 ${gameLabel}  •  SpelPoängen Forum` },
        timestamp: new Date().toISOString(),
      },
    ],
  });
}

export async function sendLevelUpAnnouncement(
  username: string,
  newLevel: number,
  discordId: string | null | undefined
): Promise<void> {
  const channelId = process.env.DISCORD_ANNOUNCEMENTS_CHANNEL_ID;
  if (!channelId) return;

  const who = discordId ? `<@${discordId}>` : `**${username}**`;
  await sendToChannel(channelId, {
    content: `🏆 GG! ${who} nådde precis **Level ${newLevel}**! Håll streaken vid liv 🔥`,
  });
}

export async function sendLootDropEmbed(item: {
  name: string;
  description: string;
  priceSek: number;
  imageUrl?: string | null;
}): Promise<void> {
  const channelId =
    process.env.DISCORD_LOOT_CHANNEL_ID ?? process.env.DISCORD_ANNOUNCEMENTS_CHANNEL_ID;
  if (!channelId) return;

  const alertRoleId = process.env.DISCORD_LOOT_ALERT_ROLE_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://spelpoangen.se";
  const rolePing = alertRoleId ? `<@&${alertRoleId}> ` : "";

  await sendToChannel(channelId, {
    content: `${rolePing}🎁 **Ny Loot Drop är live!**`,
    embeds: [
      {
        title: item.name,
        description: item.description.slice(0, 300),
        url: `${appUrl}/shop`,
        color: 0xfacc15,
        ...(item.imageUrl ? { thumbnail: { url: item.imageUrl } } : {}),
        fields: [{ name: "Pris", value: `${item.priceSek.toFixed(0)} kr`, inline: true }],
        footer: { text: "SpelPoängen Butik" },
        timestamp: new Date().toISOString(),
      },
    ],
  });
}

// ─── Leaderboard (auto-updating pinned message) ────────────────────────────────

export async function updateLeaderboardMessage(
  players: { name: string | null; xp: number; level: number }[]
): Promise<void> {
  const channelId = process.env.DISCORD_LEADERBOARD_CHANNEL_ID;
  const appId = process.env.DISCORD_APPLICATION_ID;
  if (!channelId || !process.env.DISCORD_BOT_TOKEN) return;

  const rows = players
    .slice(0, 10)
    .map((u, i) => {
      const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `\`${i + 1}.\``;
      return `${medal} **${u.name ?? "Anonym"}** — Nivå ${u.level} • ${u.xp.toLocaleString("sv")} XP`;
    })
    .join("\n");

  const embed = {
    title: "🏆 SpelPoängen Topplista",
    description: rows.length ? rows : "Inga spelare ännu.",
    color: 0xfacc15,
    footer: { text: "Uppdateras automatiskt  •  spelpoangen.se" },
    timestamp: new Date().toISOString(),
  };

  // Try to find and edit our previous message in the channel
  let existingMessageId: string | null = null;
  if (appId) {
    try {
      const res = await fetch(`${DISCORD_API}/channels/${channelId}/messages?limit=20`, {
        headers: botHeaders(),
      });
      if (res.ok) {
        const messages = (await res.json()) as { id: string; author: { id: string } }[];
        const own = messages.find((m) => m.author.id === appId);
        if (own) existingMessageId = own.id;
      }
    } catch { /* fall through to post new */ }
  }

  if (existingMessageId) {
    try {
      const res = await fetch(`${DISCORD_API}/channels/${channelId}/messages/${existingMessageId}`, {
        method: "PATCH",
        headers: botHeaders(),
        body: JSON.stringify({ embeds: [embed] }),
      });
      if (res.ok) return;
    } catch { /* fall through to post new */ }
  }

  // No existing message — post fresh
  await sendToChannel(channelId, { embeds: [embed] });
}

// ─── Level roles ───────────────────────────────────────────────────────────────
// Milestones are defined in lib/level-milestones.ts (shared with UI).
// Roles are cumulative — reaching level 25 keeps level 1 and 10 roles.

import { LEVEL_MILESTONES } from "@/lib/level-milestones";

export async function syncLevelRoles(discordId: string, level: number): Promise<void> {
  const guildId = process.env.DISCORD_GUILD_ID;
  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!guildId || !botToken || !discordId) return;

  await Promise.all(
    LEVEL_MILESTONES.map(async ({ level: threshold, discordEnvKey }) => {
      const roleId = process.env[discordEnvKey];
      if (!roleId) return;
      if (level >= threshold) {
        await fetch(`${DISCORD_API}/guilds/${guildId}/members/${discordId}/roles/${roleId}`, {
          method: "PUT",
          headers: { Authorization: `Bot ${botToken}`, "Content-Type": "application/json" },
          body: "{}",
        }).catch(() => {});
      }
    })
  );
}

// ─── Role sync ─────────────────────────────────────────────────────────────────

/** Resolve a non-empty env var (treats "" as missing). */
function env(key: string): string | undefined {
  const v = process.env[key];
  return v && v.trim() ? v.trim() : undefined;
}

function getTierRoleId(tier: string): string | undefined {
  const map: Record<string, string | undefined> = {
    ROOKIE:   env("DISCORD_ROOKIE_ROLE_ID")  ?? env("DISCORD_LEVEL_1_ROLE_ID"),
    GRINDER:  env("DISCORD_GRINDER_ROLE_ID") ?? env("DISCORD_LEVEL_10_ROLE_ID"),
    VETERAN:  env("DISCORD_LEVEL_25_ROLE_ID"),
    LEGEND:   env("DISCORD_LEGEND_ROLE_ID")  ?? env("DISCORD_LEVEL_50_ROLE_ID"),
    PREMIUM:  env("DISCORD_PREMIUM_ROLE_ID") ?? env("DISCORD_VIP_ROLE_ID"),
    GOLD:     env("DISCORD_GOLD_ROLE_ID"),
    FREE:     env("DISCORD_FREE_ROLE_ID"),
  };
  return map[tier];
}

function getAllTierRoleIds(): string[] {
  return [
    env("DISCORD_ROOKIE_ROLE_ID")  ?? env("DISCORD_LEVEL_1_ROLE_ID"),
    env("DISCORD_GRINDER_ROLE_ID") ?? env("DISCORD_LEVEL_10_ROLE_ID"),
    env("DISCORD_LEVEL_25_ROLE_ID"),
    env("DISCORD_LEGEND_ROLE_ID")  ?? env("DISCORD_LEVEL_50_ROLE_ID"),
    env("DISCORD_PREMIUM_ROLE_ID") ?? env("DISCORD_VIP_ROLE_ID"),
    env("DISCORD_GOLD_ROLE_ID"),
    env("DISCORD_FREE_ROLE_ID"),
  ].filter(Boolean) as string[];
}

export async function syncUserTierRole(
  discordId: string,
  tier: string
): Promise<void> {
  const guildId = process.env.DISCORD_GUILD_ID;
  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!guildId || !botToken || !discordId) return;

  const targetRoleId = getTierRoleId(tier);
  const allRoleIds = getAllTierRoleIds();

  // Remove all tier roles first, then add the correct one
  await Promise.all(
    allRoleIds
      .filter((id) => id !== targetRoleId)
      .map((id) =>
        fetch(`${DISCORD_API}/guilds/${guildId}/members/${discordId}/roles/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bot ${botToken}` },
        }).catch(() => {})
      )
  );

  if (targetRoleId) {
    await fetch(
      `${DISCORD_API}/guilds/${guildId}/members/${discordId}/roles/${targetRoleId}`,
      {
        method: "PUT",
        headers: { Authorization: `Bot ${botToken}`, "Content-Type": "application/json" },
        body: "{}",
      }
    ).catch(() => {});
  }
}
