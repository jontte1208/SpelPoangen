import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateLevel } from "@/lib/gamification";
import { getWeekIndex } from "@/lib/quest-system";
import { syncUserTierRole } from "@/lib/discord-bot";
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
    select: { xp: true },
  });

  const nextXP = Math.max(0, currentUser.xp + parsedXpDelta);
  const nextLevel = calculateLevel(nextXP);

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

  let discordSync: "success" | "skipped" | "error" = "skipped";
  let discordSyncError: string | undefined;

  if (nextTier && user.discordId) {
    try {
      await syncUserTierRole(user.discordId, nextTier);
      discordSync = "success";
      console.info("[admin.users.patch] discord tier sync completed", {
        userId: user.id,
        discordId: user.discordId,
        tier: nextTier,
      });
    } catch (error) {
      discordSync = "error";
      discordSyncError = error instanceof Error ? error.message : String(error);
      console.error("[admin.users.patch] discord tier sync failed", {
        userId: user.id,
        discordId: user.discordId,
        tier: nextTier,
        error: discordSyncError,
      });
    }
  } else if (nextTier && !user.discordId) {
    discordSync = "skipped";
    discordSyncError = "Användaren har inget Discord-konto kopplat";
  }

  return NextResponse.json({
    id: user.id,
    xp: user.xp,
    level: user.level,
    coins: user.coins,
    tier: user.tier,
    discordSync,
    discordSyncError,
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
