"use server";

import { randomUUID } from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type BuyNowResult = {
  url?: string;
  error?: string;
};

export async function handleAffiliateClick(
  affiliateUrl: string,
  productId?: string
): Promise<BuyNowResult> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { error: "You need to be signed in to buy." };
  }

  try {
    const url = new URL(affiliateUrl);
    url.searchParams.set("userId", session.user.id);

    // When a known product is provided, also log an affiliate click and attach subid.
    if (productId) {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { id: true, isActive: true },
      });

      if (product?.isActive) {
        const subId = randomUUID();

        await prisma.affiliateClick.create({
          data: {
            userId: session.user.id,
            productId: product.id,
            subId,
            status: "PENDING",
          },
        });

        url.searchParams.set("subid", subId);
      }
    }

    return { url: url.toString() };
  } catch {
    return { error: "Could not generate affiliate link right now." };
  }
}

export async function generateAffiliateLinkAction(
  productId: string
): Promise<BuyNowResult> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { error: "You need to be signed in to buy." };
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, affiliateLink: true, isActive: true },
    });

    if (!product || !product.isActive) {
      return { error: "Product is not available." };
    }

    return handleAffiliateClick(product.affiliateLink, product.id);
  } catch {
    return { error: "Could not generate affiliate link right now." };
  }
}
