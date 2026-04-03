import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().min(1).max(500).optional(),
  category: z.enum(["FORUM", "SHOP", "STREAK", "SOCIAL"]).optional(),
  goal: z.number().int().positive().max(1000).optional(),
  rewardXP: z.number().int().nonnegative().max(10000).optional(),
  rewardCoins: z.number().int().nonnegative().max(10000).optional(),
  imageUrl: z.string().url().max(500).optional().or(z.literal("")),
  isActive: z.boolean().optional(),
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

  const existing = await prisma.quest.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Quest not found" }, { status: 404 });
  }

  const quest = await prisma.quest.update({
    where: { id },
    data: {
      ...parsed.data,
      imageUrl: parsed.data.imageUrl === "" ? null : parsed.data.imageUrl,
    },
  });

  return NextResponse.json(quest);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const existing = await prisma.quest.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Quest not found" }, { status: 404 });
  }

  await prisma.quest.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
