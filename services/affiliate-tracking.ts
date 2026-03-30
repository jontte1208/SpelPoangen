import { prisma } from "@/lib/prisma";
import { awardXP } from "@/services/xp-logic";
import { createHash } from "crypto";
import type { AffiliateClickPayload } from "@/types/products";

const XP_PER_CLICK = 5;
const XP_PER_CONVERSION = 100;

export async function recordAffiliateClick(
  payload: AffiliateClickPayload,
  userId: string | null,
  rawIp: string
): Promise<{ xpAwarded: number }> {
  const ipHash = createHash("sha256")
    .update(rawIp + process.env.IP_HASH_SECRET)
    .digest("hex");

  const existing = await prisma.affiliateClick.findFirst({
    where: {
      productId: payload.productId,
      ipHash,
      clickedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
  });

  await prisma.affiliateClick.create({
    data: {
      userId: userId ?? undefined,
      productId: payload.productId,
      affiliateCode: payload.affiliateCode ?? undefined,
      ipHash,
    },
  });

  if (existing || !userId) {
    return { xpAwarded: 0 };
  }

  await awardXP(userId, XP_PER_CLICK);
  return { xpAwarded: XP_PER_CLICK };
}

export async function recordConversion(
  productId: string,
  userId: string,
  stripePaymentId: string
): Promise<void> {
  void stripePaymentId;

  await prisma.affiliateClick.updateMany({
    where: { productId, userId, converted: false },
    data: { converted: true },
  });

  await awardXP(userId, XP_PER_CONVERSION);

  const buyer = await prisma.user.findUnique({
    where: { id: userId },
    select: { referredBy: true },
  });

  if (buyer?.referredBy) {
    const referrer = await prisma.user.findUnique({
      where: { affiliateCode: buyer.referredBy },
      select: { id: true },
    });
    if (referrer) {
      await awardXP(referrer.id, Math.floor(XP_PER_CONVERSION * 0.25));
    }
  }
}
