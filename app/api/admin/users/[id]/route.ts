import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateLevel } from "@/lib/gamification";
import { getWeekIndex } from "@/lib/quest-system";
import { sendLevelUpAnnouncement, updateLeaderboardMessage, syncLevelRoles, syncUserTierRole } from "@/lib/discord-bot";
import type { Tier } from "@prisma/client";

const ALLOWED_TIERS = new Set<Tier>(["FREE", "GOLD", "PREMIUM", "ROOKIE", "GRINDER", "LEGEND"]);

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

  const parsedXpDelta = Number.isFinite(Number(xpDelta))
    ? Math.trunc(Number(xpDelta))
    : 0;
  const parsedCoinsDelta = Number.isFinite(Number(coinsDelta))
    ? Math.trunc(Number(coinsDelta))
    : 0;

  let nextTier: Tier | undefined;
  if (typeof tier === "string") {
    if (!ALLOWED_TIERS.has(tier as Tier)) {
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
    }
    nextTier = tier as Tier;
  }

  const currentUser = await prisma.user.findUniqueOrThrow({
    where: { id: params.id },
    select: { xp: true, level: true, name: true, discordId: true },
  });

  const nextXP = Math.max(0, currentUser.xp + parsedXpDelta);
  const nextLevel = calculateLevel(nextXP);
  const didLevelUp = nextLevel > currentUser.level;

  const user = await prisma.user.update({
    where: { id: params.id },
    data: {
      xp: nextXP,
      level: nextLevel,
      coins: { increment: parsedCoinsDelta },
      ...(nextTier ? { tier: nextTier } : {}),
    },
    select: {
      id: true,
      xp: true,
      level: true,
      coins: true,
      tier: true,
      discordId: true,
    },
  });

  // Discord notifications — fire and forget
  if (didLevelUp) {
    sendLevelUpAnnouncement(currentUser.name ?? "Anonym", nextLevel, currentUser.discordId).catch(() => {});
    if (user.discordId) {
      syncLevelRoles(user.discordId, nextLevel).catch(() => {});
    }
  }
  if (parsedXpDelta !== 0) {
    prisma.user
      .findMany({ orderBy: { xp: "desc" }, take: 10, select: { name: true, xp: true, level: true } })
      .then((players) => updateLeaderboardMessage(players))
      .catch(() => {});
  }
  if (nextTier && user.discordId) {
    syncUserTierRole(user.discordId, nextTier).catch(() => {});
  }

  return NextResponse.json({
    id: user.id,
    xp: user.xp,
    level: user.level,
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

// DELETE — reset weekly quest claims for current week
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const weekIndex = getWeekIndex();

  const { count } = await prisma.userWeeklyQuestClaim.deleteMany({
    where: { userId: params.id, weekIndex },
  });

  return NextResponse.json({ deleted: count, weekIndex });
}
