import { prisma } from "@/lib/prisma";
import { xpForLevel } from "@/lib/utils";
import type { QuestTrigger } from "@/types/quests";

export async function awardXP(
  userId: string,
  amount: number
): Promise<{ newXP: number; newLevel: number; didLevelUp: boolean }> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { xp: true, level: true },
  });

  const newXP = user.xp + amount;
  let newLevel = user.level;
  let didLevelUp = false;

  while (newXP >= xpForLevel(newLevel + 1)) {
    newLevel += 1;
    didLevelUp = true;
  }

  await prisma.user.update({
    where: { id: userId },
    data: { xp: newXP, level: newLevel },
  });

  return { newXP, newLevel, didLevelUp };
}

export async function processQuestTrigger(
  userId: string,
  trigger: QuestTrigger
): Promise<void> {
  // TODO: Map trigger strings to quest IDs and complete matching quests.
  console.log(`[xp-logic] Processing trigger "${trigger}" for user ${userId}`);
}

export function getLevelProgress(xp: number, level: number): number {
  const currentThreshold = xpForLevel(level);
  const nextThreshold = xpForLevel(level + 1);
  const progress =
    ((xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
  return Math.min(Math.max(Math.round(progress), 0), 100);
}
