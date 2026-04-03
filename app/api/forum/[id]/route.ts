import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function isAdmin(session: Awaited<ReturnType<typeof getServerSession>>) {
  return session?.user?.role === "ADMIN";
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  if (typeof body.pinned !== "boolean") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const post = await prisma.forumPost.update({
    where: { id: params.id },
    data: { pinned: body.pinned },
    select: { id: true, pinned: true },
  });

  return NextResponse.json(post);
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.forumPost.delete({ where: { id: params.id } });

  return new NextResponse(null, { status: 204 });
}
