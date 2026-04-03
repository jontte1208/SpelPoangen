import { prisma } from "@/lib/prisma";

// ─── Quest definitions ──────────────────────────────────────────────────────

export type QuestDef = {
  id: string;
  title: string;
  description: string;
  xp: number;
  goal: number;
  image: string;
};

export const QUEST_POOL: QuestDef[] = [
  {
    id: "forum-warrior",
    title: "Forum-krigaren",
    description: "Skriv 5 inlägg i forumet och visa att du hör hemma här.",
    xp: 150,
    goal: 5,
    image: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800&q=80",
  },
  {
    id: "social-gaming",
    title: "Social Gaming",
    description: "Bjud in en vän till SpelPoängen och dela loot-jakten.",
    xp: 200,
    goal: 1,
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80",
  },
  {
    id: "loot-scout",
    title: "Loot-spanaren",
    description: "Besök 3 olika produkter i butiken och hitta ditt nästa köp.",
    xp: 50,
    goal: 3,
    image: "https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=800&q=80",
  },
  {
    id: "squad-up",
    title: "Squad Up",
    description: "Hitta tre spelare att köra med via forumet.",
    xp: 175,
    goal: 3,
    image: "https://images.unsplash.com/photo-1605647540924-852290f6b0d5?w=800&q=80",
  },
  {
    id: "gear-check",
    title: "Gear Check",
    description: "Kolla in 5 produkter i butiken — uppgradera din setup.",
    xp: 75,
    goal: 5,
    image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&q=80",
  },
  {
    id: "grind-session",
    title: "Grind Session",
    description: "Logga in 3 dagar i rad och håll streaken vid liv.",
    xp: 100,
    goal: 3,
    image: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&q=80",
  },
];

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

export function getWeeklyQuests(): QuestDef[] {
  return seededShuffle(QUEST_POOL, getWeekIndex()).slice(0, 3);
}

function getStartOfWeek(): Date {
  const now = new Date();
  const day = now.getUTCDay();
  const daysSinceMonday = (day + 6) % 7;
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysSinceMonday)
  );
}

// ─── Compute progress from real data ────────────────────────────────────────

async function computeQuestProgress(userId: string, questId: string): Promise<number> {
  const startOfWeek = getStartOfWeek();

  switch (questId) {
    case "forum-warrior": {
      return prisma.forumPost.count({
        where: { authorId: userId, createdAt: { gte: startOfWeek } },
      });
    }
    case "loot-scout":
    case "gear-check": {
      return prisma.userProductView.count({
        where: { userId, createdAt: { gte: startOfWeek } },
      });
    }
    case "grind-session": {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { streak: true },
      });
      return user?.streak ?? 0;
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
  progress: number;
  claimed: boolean;
};

export async function getWeeklyQuestStatus(userId: string): Promise<WeeklyQuestView[]> {
  const quests = getWeeklyQuests();
  const weekIndex = getWeekIndex();

  const [claims, ...progresses] = await Promise.all([
    prisma.userWeeklyQuestClaim.findMany({
      where: { userId, weekIndex },
      select: { questId: true },
    }),
    ...quests.map((q) => computeQuestProgress(userId, q.id)),
  ]);

  const claimedIds = new Set(claims.map((c) => c.questId));

  return quests.map((q, i) => ({
    id: q.id,
    title: q.title,
    description: q.description,
    xp: q.xp,
    goal: q.goal,
    image: q.image,
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
  const quests = getWeeklyQuests();
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
  const progress = await computeQuestProgress(userId, questId);
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
