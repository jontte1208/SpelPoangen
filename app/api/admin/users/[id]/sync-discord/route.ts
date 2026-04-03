// POST /api/admin/users/[id]/sync-discord
// Manually syncs a user's Discord level roles and tier role.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncLevelRoles, syncUserTierRole } from "@/lib/discord-bot";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: { discordId: true, level: true, tier: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (!user.discordId) {
    return NextResponse.json({ error: "User has no Discord account linked" }, { status: 400 });
  }

  await Promise.all([
    syncLevelRoles(user.discordId, user.level),
    syncUserTierRole(user.discordId, user.tier),
  ]);

  return NextResponse.json({ ok: true });
}
