import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(150).optional(),
  description: z.string().min(1).max(2000).optional(),
  priceSek: z.number().positive().optional(),
  affiliateLink: z.string().url().max(1000).optional(),
  imageUrl: z.string().url().max(500).optional().or(z.literal("")),
  xpReward: z.number().int().nonnegative().max(50000).optional(),
  coinReward: z.number().int().nonnegative().max(50000).optional(),
  category: z.string().min(1).max(50).optional(),
  isPremiumOnly: z.boolean().optional(),
  isFlashDeal: z.boolean().optional(),
  isActive: z.boolean().optional(),
  showOnHome: z.boolean().optional(),
  isOnSale: z.boolean().optional(),
  salePriceSek: z.number().positive().nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const { expiresAt, ...rest } = parsed.data;
  const product = await prisma.product.update({
    where: { id },
    data: {
      ...rest,
      imageUrl: rest.imageUrl === "" ? null : rest.imageUrl,
      ...(expiresAt !== undefined
        ? { expiresAt: expiresAt ? new Date(expiresAt) : null }
        : {}),
    },
  });

  return NextResponse.json(product);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  await prisma.product.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
