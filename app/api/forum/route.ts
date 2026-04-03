import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendForumPostEmbed } from "@/lib/discord-bot";
import { z } from "zod";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const posts = await prisma.forumPost.findMany({
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    take: 50,
    select: {
      id: true,
      title: true,
      content: true,
      game: true,
      pinned: true,
      views: true,
      createdAt: true,
      author: { select: { id: true, name: true, xp: true, level: true, image: true, role: true } },
      _count: { select: { comments: { where: { approved: true } }, likes: true } },
      likes: { where: { userId: session.user.id }, select: { id: true } },
    },
  });

  const result = posts.map(({ _count, likes, ...p }) => ({
    ...p,
    replyCount: _count.comments,
    likeCount: _count.likes,
    likedByMe: likes.length > 0,
  }));

  return NextResponse.json(result);
}

const createSchema = z.object({
  title: z.string().min(3).max(100),
  content: z.string().min(3).max(2000),
  game: z.string().max(50).optional(),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const post = await prisma.forumPost.create({
    data: {
      title: parsed.data.title,
      content: parsed.data.content,
      game: parsed.data.game ?? null,
      authorId: session.user.id,
    },
    select: {
      id: true,
      title: true,
      content: true,
      game: true,
      pinned: true,
      views: true,
      createdAt: true,
      author: { select: { id: true, name: true, xp: true, level: true, image: true, role: true } },
    },
  });

  // Discord notification — fire and forget
  sendForumPostEmbed({
    id: post.id,
    title: post.title,
    content: post.content,
    game: post.game,
    author: post.author,
  }).catch(() => {});

  return NextResponse.json(
    { ...post, replyCount: 0, likeCount: 0, likedByMe: false, commentsEnabled: true },
    { status: 201 }
  );
}
