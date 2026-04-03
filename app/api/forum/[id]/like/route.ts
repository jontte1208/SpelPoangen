import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.forumLike.findUnique({
    where: { postId_userId: { postId: params.id, userId: session.user.id } },
  });

  if (existing) {
    await prisma.forumLike.delete({ where: { id: existing.id } });
    const count = await prisma.forumLike.count({ where: { postId: params.id } });
    return NextResponse.json({ liked: false, count });
  } else {
    await prisma.forumLike.create({ data: { postId: params.id, userId: session.user.id } });
    const count = await prisma.forumLike.count({ where: { postId: params.id } });
    return NextResponse.json({ liked: true, count });
  }
}
