import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
      createdAt: true,
      author: { select: { id: true, name: true, xp: true, level: true, image: true, role: true } },
    },
  });

  return NextResponse.json(posts);
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
      createdAt: true,
      author: { select: { id: true, name: true, xp: true, level: true, image: true, role: true } },
    },
  });

  return NextResponse.json(post, { status: 201 });
}
