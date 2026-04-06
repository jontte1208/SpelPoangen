import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();
    const products = await prisma.product.findMany({
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
        expiresAt: true,
        xpReward: true,
        coinReward: true,
        affiliateLink: true,
        imageUrl: true,
      },
    });
    return NextResponse.json(products);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
