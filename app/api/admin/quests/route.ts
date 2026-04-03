import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  category: z.enum(["FORUM", "SHOP", "STREAK", "SOCIAL"]),
  goal: z.number().int().positive().max(1000),
  rewardXP: z.number().int().nonnegative().max(10000),
  rewardCoins: z.number().int().nonnegative().max(10000).default(0),
  imageUrl: z.string().url().max(500).optional().or(z.literal("")),
  isActive: z.boolean().default(true),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const quests = await prisma.quest.findMany({
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
    include: { _count: { select: { userQuests: true } } },
  });

  return NextResponse.json(quests);
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

  const quest = await prisma.quest.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      category: parsed.data.category,
      goal: parsed.data.goal,
      rewardXP: parsed.data.rewardXP,
      rewardCoins: parsed.data.rewardCoins,
      imageUrl: parsed.data.imageUrl || null,
      isActive: parsed.data.isActive,
    },
  });

  return NextResponse.json(quest, { status: 201 });
}
