import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const BROADCAST_KEY = "MAIN";

export async function GET() {
  const broadcast = await prisma.globalBroadcast.findUnique({
    where: { broadcastKey: BROADCAST_KEY },
    select: { message: true, isActive: true, updatedAt: true },
  });

  const isActive = Boolean(broadcast?.isActive && broadcast.message.trim().length > 0);

  return NextResponse.json({
    isActive,
    message: isActive ? broadcast?.message ?? "" : "",
    updatedAt: broadcast?.updatedAt?.toISOString() ?? null,
  });
}
