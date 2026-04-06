import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1).max(150).optional(),
  description: z.string().min(1).max(2000).optional(),
  coinCost: z.number().int().nonnegative().optional(),
  stock: z.number().int().min(-1).optional(),
  category: z.enum(["DIGITAL", "PHYSICAL"]).optional(),
  discordRoleId: z.string().nullable().optional(),
  imageUrl: z.string().url().nullable().optional().or(z.literal("")),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return null;
  return session;
}

export async function PUT(request: Request, context: RouteContext) {
  if (!await requireAdmin()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { imageUrl, ...rest } = parsed.data;
  const item = await prisma.shopItem.update({
    where: { id },
    data: {
      ...rest,
      ...(imageUrl !== undefined ? { imageUrl: imageUrl || null } : {}),
    },
  });

  return NextResponse.json(item);
}

export async function DELETE(_req: Request, context: RouteContext) {
  if (!await requireAdmin()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  await prisma.shopItem.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
