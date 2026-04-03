import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = session.user.role === "ADMIN";

  const comments = await prisma.forumComment.findMany({
    where: {
      postId: params.id,
      ...(isAdmin ? {} : { approved: true }),
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      content: true,
      approved: true,
      createdAt: true,
      author: { select: { id: true, name: true, image: true, level: true } },
    },
  });

  return NextResponse.json(comments);
}

const commentSchema = z.object({
  content: z.string().min(2).max(1000),
});

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const post = await prisma.forumPost.findUnique({
    where: { id: params.id },
    select: { commentsEnabled: true },
  });

  if (!post || !post.commentsEnabled) {
    return NextResponse.json({ error: "Comments disabled" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = commentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const comment = await prisma.forumComment.create({
    data: {
      content: parsed.data.content,
      postId: params.id,
      authorId: session.user.id,
    },
    select: {
      id: true,
      content: true,
      approved: true,
      createdAt: true,
      author: { select: { id: true, name: true, image: true, level: true } },
    },
  });

  return NextResponse.json(comment, { status: 201 });
}
