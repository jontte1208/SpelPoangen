import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const BROADCAST_KEY = "MAIN";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const broadcast = await prisma.globalBroadcast.findUnique({
    where: { broadcastKey: BROADCAST_KEY },
    select: { message: true, isActive: true, updatedAt: true },
  });

  return NextResponse.json({
    message: broadcast?.message ?? "",
    isActive: broadcast?.isActive ?? false,
    updatedAt: broadcast?.updatedAt?.toISOString() ?? null,
  });
}

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const body = await req.json().catch(() => ({}));
  const message = typeof body?.message === "string" ? body.message.trim() : "";

  if (!message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  if (message.length > 280) {
    return NextResponse.json({ error: "Message too long" }, { status: 400 });
  }

  const broadcast = await prisma.globalBroadcast.upsert({
    where: { broadcastKey: BROADCAST_KEY },
    create: { broadcastKey: BROADCAST_KEY, message, isActive: true },
    update: { message, isActive: true },
    select: { message: true, isActive: true, updatedAt: true },
  });

  return NextResponse.json({
    message: broadcast.message,
    isActive: broadcast.isActive,
    updatedAt: broadcast.updatedAt.toISOString(),
  });
}

export async function DELETE() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const broadcast = await prisma.globalBroadcast.upsert({
    where: { broadcastKey: BROADCAST_KEY },
    create: { broadcastKey: BROADCAST_KEY, message: "", isActive: false },
    update: { isActive: false },
    select: { message: true, isActive: true, updatedAt: true },
  });

  return NextResponse.json({
    message: broadcast.message,
    isActive: broadcast.isActive,
    updatedAt: broadcast.updatedAt.toISOString(),
  });
}
