import { prisma } from "@/lib/prisma";
import { awardXP } from "@/services/xp-logic";
import { randomUUID } from "crypto";
import type { AffiliateClickPayload } from "@/types/products";

const XP_PER_CLICK = 5;
const XP_PER_CONVERSION = 100;

export async function recordAffiliateClick(
  payload: AffiliateClickPayload,
  userId: string | null,
  _rawIp: string
): Promise<{ xpAwarded: number }> {
  const existing = await prisma.affiliateClick.findFirst({
    where: {
      productId: payload.productId,
      userId: userId ?? undefined,
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
  });

  await prisma.affiliateClick.create({
    data: {
      userId: userId ?? undefined,
      productId: payload.productId,
      subId: randomUUID(),
      status: "PENDING",
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
    where: { productId, userId, status: "PENDING" },
    data: { status: "VERIFIED" },
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
