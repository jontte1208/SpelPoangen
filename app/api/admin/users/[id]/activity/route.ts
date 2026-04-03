import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type ActivityItem = {
  id: string;
  type: "forum_post" | "quest_claim" | "product_click";
  title: string;
  description: string;
  createdAt: string;
};

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const requestedLimit = Number(searchParams.get("limit"));
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(Math.trunc(requestedLimit), 1), 50)
    : 30;

  const [recentPosts, recentQuestClaims, recentProductClicks] = await Promise.all([
    prisma.forumPost.findMany({
      where: { authorId: params.id },
      select: { id: true, title: true, game: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.userWeeklyQuestClaim.findMany({
      where: { userId: params.id },
      select: {
        id: true,
        questId: true,
        xpAwarded: true,
        weekIndex: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.userProductView.findMany({
      where: { userId: params.id },
      select: {
        id: true,
        createdAt: true,
        product: { select: { name: true, category: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const questIds = Array.from(new Set(recentQuestClaims.map((claim) => claim.questId)));
  const quests = questIds.length
    ? await prisma.quest.findMany({
        where: { id: { in: questIds } },
        select: { id: true, title: true },
      })
    : [];
  const questTitleById = new Map(quests.map((quest) => [quest.id, quest.title]));

  const timeline: ActivityItem[] = [
    ...recentPosts.map((post) => ({
      id: `post_${post.id}`,
      type: "forum_post" as const,
      title: post.title,
      description: post.game ? `Foruminlägg i ${post.game}` : "Foruminlägg",
      createdAt: post.createdAt.toISOString(),
    })),
    ...recentQuestClaims.map((claim) => ({
      id: `quest_${claim.id}`,
      type: "quest_claim" as const,
      title: questTitleById.get(claim.questId) ?? `Quest ${claim.questId.slice(0, 8)}`,
      description: `Quest claimad (+${claim.xpAwarded} XP) vecka ${claim.weekIndex}`,
      createdAt: claim.createdAt.toISOString(),
    })),
    ...recentProductClicks.map((click) => ({
      id: `click_${click.id}`,
      type: "product_click" as const,
      title: click.product.name,
      description: click.product.category
        ? `Produktklick i kategorin ${click.product.category}`
        : "Produktklick",
      createdAt: click.createdAt.toISOString(),
    })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);

  return NextResponse.json({
    timeline,
    lastForumPostAt: recentPosts[0]?.createdAt.toISOString() ?? null,
    lastQuestClaimAt: recentQuestClaims[0]?.createdAt.toISOString() ?? null,
    lastProductClickAt: recentProductClicks[0]?.createdAt.toISOString() ?? null,
  });
}
