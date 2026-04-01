import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      discordId: true,
      xp: true,
      coins: true,
      gold: true,
      level: true,
      streak: true,
      tier: true,
      role: true,
      isBanned: true,
      affiliateCode: true,
      referredBy: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
      stripeCurrentPeriodEnd: true,
      lastLogin: true,
      createdAt: true,
      updatedAt: true,
      accounts: {
        where: { provider: "discord" },
        select: {
          providerAccountId: true,
          scope: true,
          expires_at: true,
          token_type: true,
        },
        take: 1,
      },
    },
    orderBy: { xp: "desc" },
  });

  return NextResponse.json(users);
}
