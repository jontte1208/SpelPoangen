import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [
    totalCoinsInCirculation,
    totalCoinsSpentOnOrders,
    totalOrders,
    pendingOrders,
    fulfilledOrders,
    stripeRevenue,
  ] = await Promise.all([
    // Total coins held by all users
    prisma.user.aggregate({ _sum: { coins: true } }),
    // Total coins spent in loot shop
    prisma.order.aggregate({
      where: { status: { not: "CANCELLED" } },
      _sum: { coinsSpent: true },
    }),
    // Total orders
    prisma.order.count({ where: { status: { not: "CANCELLED" } } }),
    // Pending (needs fulfillment)
    prisma.order.count({ where: { status: "PENDING" } }),
    // Fulfilled
    prisma.order.count({ where: { status: "FULFILLED" } }),
    // Stripe revenue (purchases)
    prisma.purchase.aggregate({ _sum: { amount: true } }),
  ]);

  const coinsInCirculation = totalCoinsInCirculation._sum.coins ?? 0;
  const coinsSpentInShop = totalCoinsSpentOnOrders._sum.coinsSpent ?? 0;
  // 100 coins = 1 SEK cost basis
  const estimatedLiabilitySeK = coinsInCirculation / 100;
  const estimatedShopCostSek = coinsSpentInShop / 100;
  const stripeRevenueSek = stripeRevenue._sum.amount ?? 0;

  return NextResponse.json({
    coinsInCirculation,
    coinsSpentInShop,
    estimatedLiabilitySeK,
    estimatedShopCostSek,
    stripeRevenueSek,
    totalOrders,
    pendingOrders,
    fulfilledOrders,
  });
}
