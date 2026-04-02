import { prisma } from "@/lib/prisma";

// ------------------------------------
// XP curve: Level 1 = 0 XP, Level 2 = 500 XP, Level 3 = 2 000 XP, …
// threshold(n) = floor(500 * (n - 1)^2)
// ------------------------------------

export function xpThreshold(level: number): number {
  if (level <= 1) return 0;
  return Math.floor(500 * Math.pow(level - 1, 2));
}

export function calculateLevel(xp: number): number {
  let level = 1;
  while (xpThreshold(level + 1) <= xp) {
    level++;
  }
  return level;
}

export function levelProgress(xp: number): {
  level: number;
  currentXP: number;
  requiredXP: number;
  percent: number;
} {
  const level = calculateLevel(xp);
  const floor = xpThreshold(level);
  const ceil = xpThreshold(level + 1);
  const currentXP = xp - floor;
  const requiredXP = ceil - floor;
  const percent = Math.round((currentXP / requiredXP) * 100);
  return { level, currentXP, requiredXP, percent };
}

// ------------------------------------
// addXP
// ------------------------------------

export async function addXP(
  userId: string,
  amount: number
): Promise<{ newXP: number; newLevel: number; didLevelUp: boolean }> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { xp: true, level: true },
  });

  const newXP = user.xp + amount;
  const newLevel = calculateLevel(newXP);
  const didLevelUp = newLevel > user.level;

  await prisma.user.update({
    where: { id: userId },
    data: { xp: newXP, level: newLevel },
  });

  return { newXP, newLevel, didLevelUp };
}

// ------------------------------------
// updateStreak
// ------------------------------------

export async function updateStreak(
  userId: string
): Promise<{ streak: number; wasReset: boolean }> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { streak: true, lastLogin: true },
  });

  const now = new Date();
  let streak = user.streak;
  let wasReset = false;

  if (user.lastLogin) {
    const msSinceLast = now.getTime() - user.lastLogin.getTime();
    const hoursSinceLast = msSinceLast / (1000 * 60 * 60);

    if (hoursSinceLast < 20) {
      // Already logged in today — no change
      return { streak, wasReset: false };
    } else if (hoursSinceLast <= 28) {
      // Logged in within the next-day window — keep streak going
      streak += 1;
    } else {
      // More than 28 h without login — reset
      streak = 1;
      wasReset = true;
    }
  } else {
    // First ever login
    streak = 1;
  }

  await prisma.user.update({
    where: { id: userId },
    data: { streak, lastLogin: now },
  });

  return { streak, wasReset };
}

// ------------------------------------
// claimQuestReward
// ------------------------------------

type ClaimResult =
  | { success: true; xpAwarded: number; coinsAwarded: number; newLevel: number; didLevelUp: boolean }
  | { success: false; reason: string };

export async function claimQuestReward(
  userId: string,
  questId: string
): Promise<ClaimResult> {
  const quest = await prisma.quest.findUnique({
    where: { id: questId },
    include: { userQuests: { where: { userId } } },
  });

  if (!quest || !quest.isActive) {
    return { success: false, reason: "Quest not found or inactive" };
  }

  if (quest.type === "ONETIME" && quest.userQuests.length > 0) {
    return { success: false, reason: "Quest already completed" };
  }

  if (quest.type === "DAILY" && quest.userQuests.length > 0) {
    const lastCompletion = quest.userQuests[quest.userQuests.length - 1].completedAt;
    const today = new Date();
    const isSameDay =
      lastCompletion.getFullYear() === today.getFullYear() &&
      lastCompletion.getMonth() === today.getMonth() &&
      lastCompletion.getDate() === today.getDate();

    if (isSameDay) {
      return { success: false, reason: "Daily quest already claimed today" };
    }
  }

  await prisma.userQuest.create({
    data: { userId, questId },
  });

  const { newLevel, didLevelUp } = await addXP(userId, quest.rewardXP);

  if (quest.rewardCoins > 0) {
    await prisma.user.update({
      where: { id: userId },
      data: { coins: { increment: quest.rewardCoins } },
    });
  }

  return {
    success: true,
    xpAwarded: quest.rewardXP,
    coinsAwarded: quest.rewardCoins,
    newLevel,
    didLevelUp,
  };
}
