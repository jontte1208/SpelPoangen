import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1).max(150),
  description: z.string().min(1).max(2000),
  coinCost: z.number().int().nonnegative(),
  stock: z.number().int().min(-1).default(-1),
  category: z.enum(["DIGITAL", "PHYSICAL"]).default("DIGITAL"),
  discordRoleId: z.string().optional().nullable(),
  unlockedBannerKeys: z.string().optional().nullable(),
  imageUrl: z.string().url().optional().nullable().or(z.literal("")),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return null;
  return session;
}

export async function GET() {
  if (!await requireAdmin()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await prisma.shopItem.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: { _count: { select: { orders: true } } },
  });

  return NextResponse.json(items);
}

export async function POST(request: Request) {
  if (!await requireAdmin()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { imageUrl, discordRoleId, unlockedBannerKeys, ...rest } = parsed.data;
  const item = await prisma.shopItem.create({
    data: {
      ...rest,
      imageUrl: imageUrl || null,
      discordRoleId: discordRoleId || null,
      unlockedBannerKeys: unlockedBannerKeys || null,
    },
  });

  return NextResponse.json(item, { status: 201 });
}
