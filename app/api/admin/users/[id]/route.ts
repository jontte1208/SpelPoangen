import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Tier } from "@prisma/client";

const DISCORD_API_BASE = "https://discord.com/api/v10";
const ALLOWED_TIERS = new Set<Tier>(["FREE", "GOLD", "PREMIUM", "ROOKIE", "GRINDER", "LEGEND"]);

function getDiscordTierRoleConfig() {
  const guildId = process.env.DISCORD_GUILD_ID;
  const botToken = process.env.DISCORD_BOT_TOKEN;

  if (!guildId || !botToken) {
    return null;
  }

  return {
    guildId,
    botToken,
    tierRoleIds: {
      ROOKIE: process.env.DISCORD_ROOKIE_ROLE_ID ?? null,
      GRINDER: process.env.DISCORD_GRINDER_ROLE_ID ?? null,
      LEGEND: process.env.DISCORD_LEGEND_ROLE_ID ?? null,
      PREMIUM: process.env.DISCORD_PREMIUM_ROLE_ID ?? process.env.DISCORD_VIP_ROLE_ID ?? null,
      GOLD: process.env.DISCORD_GOLD_ROLE_ID ?? null,
      FREE: process.env.DISCORD_FREE_ROLE_ID ?? null,
    } as Record<Tier, string | null>,
  };
}

async function updateDiscordMemberRole(params: {
  guildId: string;
  botToken: string;
  discordUserId: string;
  roleId: string;
  add: boolean;
}) {
  const { guildId, botToken, discordUserId, roleId, add } = params;

  const response = await fetch(
    `${DISCORD_API_BASE}/guilds/${guildId}/members/${discordUserId}/roles/${roleId}`,
    {
      method: add ? "PUT" : "DELETE",
      headers: {
        Authorization: `Bot ${botToken}`,
      },
    }
  );

  if (response.ok || response.status === 204 || response.status === 404) {
    return;
  }

  const body = await response.text();
  throw new Error(
    `Discord role sync failed (${response.status}): ${body.slice(0, 300)}`
  );
}

async function syncDiscordTierRoles(params: {
  discordUserId: string;
  tier: Tier;
  userId: string;
}) {
  const config = getDiscordTierRoleConfig();
  if (!config) {
    console.warn("[admin.users.patch] discord tier sync skipped", {
      userId: params.userId,
      discordUserId: params.discordUserId,
      tier: params.tier,
      reason: "missing_guild_or_bot_token",
    });
    return;
  }

  const uniqueRoleIds = Array.from(
    new Set(Object.values(config.tierRoleIds).filter((roleId): roleId is string => Boolean(roleId)))
  );

  if (uniqueRoleIds.length === 0) {
    console.warn("[admin.users.patch] discord tier sync skipped", {
      userId: params.userId,
      discordUserId: params.discordUserId,
      tier: params.tier,
      reason: "missing_role_mapping",
    });
    return;
  }

  const targetRoleId = config.tierRoleIds[params.tier];

  for (const roleId of uniqueRoleIds) {
    const shouldAdd = roleId === targetRoleId;
    await updateDiscordMemberRole({
      guildId: config.guildId,
      botToken: config.botToken,
      discordUserId: params.discordUserId,
      roleId,
      add: shouldAdd,
    });
  }

  console.info("[admin.users.patch] discord tier sync completed", {
    userId: params.userId,
    discordUserId: params.discordUserId,
    tier: params.tier,
    guildId: config.guildId,
    targetRoleId,
  });
}

// PATCH — edit XP / coins
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { xpDelta, coinsDelta, tier } = await req.json();

  let nextTier: Tier | undefined;
  if (typeof tier === "string") {
    if (!ALLOWED_TIERS.has(tier as Tier)) {
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
    }
    nextTier = tier as Tier;
  }

  const user = await prisma.user.update({
    where: { id: params.id },
    data: {
      xp: { increment: xpDelta ?? 0 },
      coins: { increment: coinsDelta ?? 0 },
      ...(nextTier ? { tier: nextTier } : {}),
    },
    select: { id: true, xp: true, coins: true, tier: true, discordId: true },
  });

  if (nextTier && user.discordId) {
    try {
      await syncDiscordTierRoles({
        userId: user.id,
        discordUserId: user.discordId,
        tier: nextTier,
      });
    } catch (error) {
      console.error("[admin.users.patch] discord tier sync failed", {
        userId: user.id,
        discordUserId: user.discordId,
        tier: nextTier,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return NextResponse.json({
    id: user.id,
    xp: user.xp,
    coins: user.coins,
    tier: user.tier,
  });
}

// POST — ban / unban
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { ban } = await req.json();

  const user = await prisma.user.update({
    where: { id: params.id },
    data: { isBanned: ban },
    select: { id: true, isBanned: true },
  });

  return NextResponse.json(user);
}
