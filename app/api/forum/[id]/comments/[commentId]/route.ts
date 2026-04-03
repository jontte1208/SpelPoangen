import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; commentId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  if (typeof body.approved !== "boolean") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const comment = await prisma.forumComment.update({
    where: { id: params.commentId },
    data: { approved: body.approved },
    select: { id: true, approved: true },
  });

  return NextResponse.json(comment);
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string; commentId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.forumComment.delete({ where: { id: params.commentId } });

  return new NextResponse(null, { status: 204 });
}
