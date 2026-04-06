import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true, showOnHome: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        priceSek: true,
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
