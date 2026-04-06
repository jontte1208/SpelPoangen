import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(150),
  description: z.string().min(1).max(2000),
  priceSek: z.number().positive(),
  affiliateLink: z.string().url().max(1000),
  imageUrl: z.string().url().max(500).optional().or(z.literal("")),
  xpReward: z.number().int().nonnegative().max(50000).default(0),
  coinReward: z.number().int().nonnegative().max(50000).default(0),
  category: z.string().min(1).max(50),
  isPremiumOnly: z.boolean().default(false),
  isFlashDeal: z.boolean().default(false),
  isActive: z.boolean().default(true),
  showOnHome: z.boolean().default(false),
  isOnSale: z.boolean().default(false),
  salePriceSek: z.number().positive().nullable().default(null),
  expiresAt: z.string().datetime().nullable().default(null),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const products = await prisma.product.findMany({
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
    include: {
      _count: { select: { affiliateClicks: true, purchases: true } },
    },
  });

  return NextResponse.json(products);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const product = await prisma.product.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      priceSek: parsed.data.priceSek,
      affiliateLink: parsed.data.affiliateLink,
      imageUrl: parsed.data.imageUrl || null,
      xpReward: parsed.data.xpReward,
      coinReward: parsed.data.coinReward,
      category: parsed.data.category,
      isPremiumOnly: parsed.data.isPremiumOnly,
      isFlashDeal: parsed.data.isFlashDeal,
      isActive: parsed.data.isActive,
      showOnHome: parsed.data.showOnHome,
      isOnSale: parsed.data.isOnSale,
      salePriceSek: parsed.data.salePriceSek,
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
    },
  });

  return NextResponse.json(product, { status: 201 });
}
