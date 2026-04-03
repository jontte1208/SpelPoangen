import { prisma } from "@/lib/prisma";
import type { QuestCategory } from "@prisma/client";

// ─── Types ──────────────────────────────────────────────────────────────────

export type QuestDef = {
  id: string;
  title: string;
  description: string;
  xp: number;
  goal: number;
  image: string;
  category: QuestCategory;
};

// ─── Week helpers ───────────────────────────────────────────────────────────

export function getWeekIndex() {
  const EPOCH_MONDAY = 4 * 24 * 60 * 60 * 1000;
  return Math.floor((Date.now() - EPOCH_MONDAY) / (7 * 24 * 60 * 60 * 1000));
}

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const copy = [...arr];
  let s = seed;
  for (let i = copy.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function getStartOfWeek(): Date {
  const now = new Date();
  const day = now.getUTCDay();
  const daysSinceMonday = (day + 6) % 7;
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysSinceMonday)
  );
}

// ─── Load quests from DB ────────────────────────────────────────────────────

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&q=80";

async function loadActiveQuests(): Promise<QuestDef[]> {
  const quests = await prisma.quest.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
  });

  return quests.map((q) => ({
    id: q.id,
    title: q.title,
    description: q.description,
    xp: q.rewardXP,
    goal: q.goal,
    image: q.imageUrl ?? DEFAULT_IMAGE,
    category: q.category,
  }));
}

export async function getWeeklyQuests(): Promise<QuestDef[]> {
  const all = await loadActiveQuests();
  return seededShuffle(all, getWeekIndex()).slice(0, 3);
}

// ─── Category-driven progress computation ───────────────────────────────────

async function computeQuestProgress(
  userId: string,
  quest: QuestDef
): Promise<number> {
  const startOfWeek = getStartOfWeek();

  switch (quest.category) {
    case "FORUM": {
      return prisma.forumPost.count({
        where: { authorId: userId, createdAt: { gte: startOfWeek } },
      });
    }
    case "SHOP": {
      return prisma.userProductView.count({
        where: { userId, createdAt: { gte: startOfWeek } },
      });
    }
    case "STREAK": {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { streak: true },
      });
      return user?.streak ?? 0;
    }
    case "SOCIAL": {
      // Social quests track manually or via future integrations
      return 0;
    }
    default:
      return 0;
  }
}

// ─── Get status for all weekly quests ───────────────────────────────────────

export type WeeklyQuestView = {
  id: string;
  title: string;
  description: string;
  xp: number;
  goal: number;
  image: string;
  category: string;
  progress: number;
  claimed: boolean;
};

export async function getWeeklyQuestStatus(userId: string): Promise<WeeklyQuestView[]> {
  const quests = await getWeeklyQuests();
  const weekIndex = getWeekIndex();

  const [claims, ...progresses] = await Promise.all([
    prisma.userWeeklyQuestClaim.findMany({
      where: { userId, weekIndex },
      select: { questId: true },
    }),
    ...quests.map((q) => computeQuestProgress(userId, q)),
  ]);

  const claimedIds = new Set(claims.map((c) => c.questId));

  return quests.map((q, i) => ({
    id: q.id,
    title: q.title,
    description: q.description,
    xp: q.xp,
    goal: q.goal,
    image: q.image,
    category: q.category,
    progress: Math.min(progresses[i], q.goal),
    claimed: claimedIds.has(q.id),
  }));
}

// ─── Validate and claim ─────────────────────────────────────────────────────

type ClaimResult =
  | {
      success: true;
      xpAwarded: number;
      newXP: number;
      newLevel: number;
      previousLevel: number;
      didLevelUp: boolean;
    }
  | { success: false; error: string };

export async function claimWeeklyQuest(
  userId: string,
  questId: string
): Promise<ClaimResult> {
  const quests = await getWeeklyQuests();
  const quest = quests.find((q) => q.id === questId);
  if (!quest) {
    return { success: false, error: "Quest is not active this week" };
  }

  const weekIndex = getWeekIndex();

  const existing = await prisma.userWeeklyQuestClaim.findUnique({
    where: { userId_questId_weekIndex: { userId, questId, weekIndex } },
  });
  if (existing) {
    return { success: false, error: "Already claimed" };
  }

  // Verify completion from real data — not client-supplied
  const progress = await computeQuestProgress(userId, quest);
  if (progress < quest.goal) {
    return { success: false, error: "Quest not completed" };
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { xp: true, level: true },
  });
  const previousLevel = user.level;

  const { addXP } = await import("@/lib/gamification");
  const { newXP, newLevel, didLevelUp } = await addXP(userId, quest.xp);

  await prisma.userWeeklyQuestClaim.create({
    data: { userId, questId, weekIndex, xpAwarded: quest.xp },
  });

  return { success: true, xpAwarded: quest.xp, newXP, newLevel, previousLevel, didLevelUp };
}

// ─── Track product view ─────────────────────────────────────────────────────

export async function trackProductView(userId: string, productId: string): Promise<void> {
  await prisma.userProductView.upsert({
    where: { userId_productId: { userId, productId } },
    create: { userId, productId },
    update: {},
  });
}
