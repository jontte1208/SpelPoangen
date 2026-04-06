import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LootShopClient from "./LootShopClient";

export const metadata = { title: "Loot Shop" };

export default async function LootShopPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const [items, user, orders] = await Promise.all([
    prisma.shopItem.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { coins: true },
    }),
    prisma.order.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { shopItem: { select: { name: true, imageUrl: true, category: true } } },
    }),
  ]);

  return (
    <LootShopClient
      initialItems={items.map((i) => ({
        ...i,
        updatedAt: i.updatedAt.toISOString(),
        createdAt: i.createdAt.toISOString(),
      }))}
      initialCoins={user?.coins ?? 0}
      initialOrders={orders.map((o) => ({
        ...o,
        createdAt: o.createdAt.toISOString(),
        updatedAt: o.updatedAt.toISOString(),
        fulfilledAt: o.fulfilledAt?.toISOString() ?? null,
      }))}
    />
  );
}
