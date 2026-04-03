import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addXP, calculateLevel } from "@/lib/gamification";
import { z } from "zod";

function getWeekIndex() {
  const EPOCH_MONDAY = 4 * 24 * 60 * 60 * 1000;
  return Math.floor((Date.now() - EPOCH_MONDAY) / (7 * 24 * 60 * 60 * 1000));
}

const schema = z.object({
  questId: z.string().min(1),
  xp: z.number().int().positive().max(1000),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const { questId, xp } = parsed.data;
  const weekIndex = getWeekIndex();

  // Check if already claimed this week
  const existing = await prisma.userWeeklyQuestClaim.findUnique({
    where: { userId_questId_weekIndex: { userId: session.user.id, questId, weekIndex } },
  });
  if (existing) return NextResponse.json({ error: "Already claimed" }, { status: 409 });

  // Get current level before XP award
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { xp: true },
  });
  const previousLevel = calculateLevel(user.xp);

  // Award XP and record claim
  const [{ newXP, newLevel, didLevelUp }] = await Promise.all([
    addXP(session.user.id, xp),
    prisma.userWeeklyQuestClaim.create({
      data: { userId: session.user.id, questId, weekIndex, xpAwarded: xp },
    }),
  ]);

  return NextResponse.json({ xpAwarded: xp, newXP, newLevel, previousLevel, didLevelUp });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const weekIndex = getWeekIndex();
  const claims = await prisma.userWeeklyQuestClaim.findMany({
    where: { userId: session.user.id, weekIndex },
    select: { questId: true },
  });

  return NextResponse.json({ claimed: claims.map((c) => c.questId) });
}
