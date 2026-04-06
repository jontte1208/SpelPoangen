import { prisma } from "@/lib/prisma";
import LootMarketSection from "@/components/market/LootMarketSection";
import BroadcastBanner from "@/components/market/BroadcastBanner";

export default async function HomePage() {
  const now = new Date();

  let products: {
    id: string;
    name: string;
    priceSek: number;
    salePriceSek: number | null;
    isOnSale: boolean;
    isFlashDeal: boolean;
    expiresAt: Date | null;
    xpReward: number;
    coinReward: number;
    affiliateLink: string;
    imageUrl: string | null;
  }[] = [];

  try {
    products = await prisma.product.findMany({
      where: {
        isActive: true,
        showOnHome: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        priceSek: true,
        salePriceSek: true,
        isOnSale: true,
        isFlashDeal: true,
        expiresAt: true,
        xpReward: true,
        coinReward: true,
        affiliateLink: true,
        imageUrl: true,
      },
    });
  } catch {}

  return (
    <main className="min-h-screen bg-[#020617] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <BroadcastBanner />
        <LootMarketSection products={products} />
      </div>
    </main>
  );
}
