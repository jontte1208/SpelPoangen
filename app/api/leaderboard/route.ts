import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "10"), 50);

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      xp: true,
      role: true,
    },
    orderBy: { xp: "desc" },
    take: limit,
  });

  return NextResponse.json(users);
}
