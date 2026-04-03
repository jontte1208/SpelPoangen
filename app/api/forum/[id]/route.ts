import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const data: {
    pinned?: boolean;
    commentsEnabled?: boolean;
    title?: string;
    content?: string;
    game?: string | null;
  } = {};

  if (typeof body.pinned === "boolean") data.pinned = body.pinned;
  if (typeof body.commentsEnabled === "boolean") data.commentsEnabled = body.commentsEnabled;
  if (typeof body.title === "string" && body.title.trim().length >= 3) data.title = body.title.trim();
  if (typeof body.content === "string" && body.content.trim().length >= 3) data.content = body.content.trim();
  if ("game" in body) data.game = body.game || null;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const post = await prisma.forumPost.update({
    where: { id: params.id },
    data,
    select: {
      id: true, title: true, content: true, game: true,
      pinned: true, commentsEnabled: true,
    },
  });

  return NextResponse.json(post);
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.forumPost.delete({ where: { id: params.id } });

  return new NextResponse(null, { status: 204 });
}
