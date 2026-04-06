import { prisma } from "@/lib/prisma";
import { BANNER_KEYS } from "@/lib/banners";

export type PurchaseResult =
  | { ok: true; orderId: string }
  | { ok: false; error: string };

/**
 * Secure coin purchase with serializable transaction to prevent race conditions.
 * Uses SELECT ... FOR UPDATE to lock the user row before deducting coins.
 */
export async function purchaseShopItem(
  userId: string,
  shopItemId: string
): Promise<PurchaseResult> {
  try {
    const orderId = await prisma.$transaction(
      async (tx) => {
        // Lock user row to prevent concurrent purchases
        const users = await tx.$queryRaw<
          { id: string; coins: number }[]
        >`SELECT id, coins FROM "User" WHERE id = ${userId} FOR UPDATE`;

        const user = users[0];
        if (!user) throw new Error("Användaren hittades inte.");

        const item = await tx.shopItem.findUnique({
          where: { id: shopItemId },
        });

        if (!item) throw new Error("Artikeln hittades inte.");
        if (!item.isActive) throw new Error("Artikeln är inte tillgänglig just nu.");
        if (item.stock === 0) throw new Error("Artikeln är slutsåld.");
        if (user.coins < item.coinCost)
          throw new Error(
            `Du har inte tillräckligt med coins. Du har ${user.coins} men behöver ${item.coinCost}.`
          );

        // Deduct coins
        await tx.user.update({
          where: { id: userId },
          data: { coins: { decrement: item.coinCost } },
        });

        // Decrement stock if limited
        if (item.stock > 0) {
          await tx.shopItem.update({
            where: { id: shopItemId },
            data: { stock: { decrement: 1 } },
          });
        }

        // Unlock banners if item grants any
        if (item.unlockedBannerKeys) {
          const keys = item.unlockedBannerKeys
            .split(",")
            .map((k) => k.trim())
            .filter((k) => BANNER_KEYS.includes(k));

          for (const bannerKey of keys) {
            await tx.userBanner.upsert({
              where: { userId_bannerKey: { userId, bannerKey } },
              create: { userId, bannerKey },
              update: {},
            });
          }
        }

        // Create order
        const order = await tx.order.create({
          data: {
            userId,
            shopItemId,
            coinsSpent: item.coinCost,
            status: item.category === "DIGITAL" ? "CONFIRMED" : "PENDING",
          },
        });

        return order.id;
      },
      { isolationLevel: "Serializable" }
    );

    return { ok: true, orderId };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Köpet misslyckades.";
    return { ok: false, error: message };
  }
}
