import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RecentActivityItem = {
  id: string;
  type: "forum_post" | "quest_claim" | "affiliate_click" | "purchase";
  text: string;
  createdAt: string;
};

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const requestedLimit = Number(searchParams.get("limit"));
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(Math.trunc(requestedLimit), 1), 30)
    : 12;

  const [forumPosts, questClaims, affiliateClicks, purchases] = await Promise.all([
    prisma.forumPost.findMany({
      select: {
        id: true,
        title: true,
        createdAt: true,
        author: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    prisma.userWeeklyQuestClaim.findMany({
      select: {
        id: true,
        questId: true,
        xpAwarded: true,
        createdAt: true,
        user: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    prisma.affiliateClick.findMany({
      select: {
        id: true,
        createdAt: true,
        user: { select: { name: true } },
        product: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    prisma.purchase.findMany({
      select: {
        id: true,
        createdAt: true,
        user: { select: { name: true } },
        product: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
  ]);

  const questIds = Array.from(new Set(questClaims.map((claim) => claim.questId)));
  const quests = questIds.length
    ? await prisma.quest.findMany({
        where: { id: { in: questIds } },
        select: { id: true, title: true },
      })
    : [];
  const questTitleById = new Map(quests.map((quest) => [quest.id, quest.title]));

  const activity: RecentActivityItem[] = [
    ...forumPosts.map((post) => ({
      id: `post_${post.id}`,
      type: "forum_post" as const,
      text: `${post.author?.name ?? "En spelare"} postade "${post.title}" i forumet`,
      createdAt: post.createdAt.toISOString(),
    })),
    ...questClaims.map((claim) => ({
      id: `quest_${claim.id}`,
      type: "quest_claim" as const,
      text: `${claim.user?.name ?? "En spelare"} klarade ${questTitleById.get(claim.questId) ?? "en quest"} (+${claim.xpAwarded} XP)`,
      createdAt: claim.createdAt.toISOString(),
    })),
    ...affiliateClicks.map((click) => ({
      id: `click_${click.id}`,
      type: "affiliate_click" as const,
      text: `${click.user?.name ?? "En spelare"} klickade på ${click.product.name}`,
      createdAt: click.createdAt.toISOString(),
    })),
    ...purchases.map((purchase) => ({
      id: `purchase_${purchase.id}`,
      type: "purchase" as const,
      text: `${purchase.user?.name ?? "En spelare"} köpte ${purchase.product.name}`,
      createdAt: purchase.createdAt.toISOString(),
    })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);

  return NextResponse.json(activity);
}
