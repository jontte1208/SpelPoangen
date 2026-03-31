import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH — edit XP / coins
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { xpDelta, coinsDelta } = await req.json();

  const user = await prisma.user.update({
    where: { id: params.id },
    data: {
      xp: { increment: xpDelta ?? 0 },
      coins: { increment: coinsDelta ?? 0 },
    },
    select: { id: true, xp: true, coins: true },
  });

  return NextResponse.json(user);
}

// POST — ban / unban
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { ban } = await req.json();

  const user = await prisma.user.update({
    where: { id: params.id },
    data: { isBanned: ban },
    select: { id: true, isBanned: true },
  });

  return NextResponse.json(user);
}
