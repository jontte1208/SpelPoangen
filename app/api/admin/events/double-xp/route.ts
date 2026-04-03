import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DOUBLE_XP_EVENT_KEY, getDoubleXPStatus } from "@/lib/global-events";

const DEFAULT_DURATION_MINUTES = 60;

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

  const status = await getDoubleXPStatus();
  return NextResponse.json(status);
}

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const body = await req.json().catch(() => ({}));
  const rawDuration = Number(body?.durationMinutes);
  const durationMinutes = Number.isFinite(rawDuration)
    ? Math.min(Math.max(Math.trunc(rawDuration), 1), 24 * 60)
    : DEFAULT_DURATION_MINUTES;

  const endsAt = new Date(Date.now() + durationMinutes * 60 * 1000);

  await prisma.globalEvent.upsert({
    where: { eventKey: DOUBLE_XP_EVENT_KEY },
    create: { eventKey: DOUBLE_XP_EVENT_KEY, endsAt },
    update: { endsAt },
  });

  return NextResponse.json({ active: true, endsAt: endsAt.toISOString() });
}

export async function DELETE() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  await prisma.globalEvent.upsert({
    where: { eventKey: DOUBLE_XP_EVENT_KEY },
    create: { eventKey: DOUBLE_XP_EVENT_KEY, endsAt: null },
    update: { endsAt: null },
  });

  return NextResponse.json({ active: false, endsAt: null });
}
