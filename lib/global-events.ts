import { prisma } from "@/lib/prisma";

export const DOUBLE_XP_EVENT_KEY = "DOUBLE_XP";

export function isDoubleXPActive(endsAt: Date | null): boolean {
  if (!endsAt) return false;
  return endsAt.getTime() > Date.now();
}

export async function getDoubleXPStatus() {
  const event = await prisma.globalEvent.findUnique({
    where: { eventKey: DOUBLE_XP_EVENT_KEY },
    select: { endsAt: true },
  });

  const endsAt = event?.endsAt ?? null;
  const active = isDoubleXPActive(endsAt);

  return {
    active,
    endsAt: active && endsAt ? endsAt.toISOString() : null,
  };
}
