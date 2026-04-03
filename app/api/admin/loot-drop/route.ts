// Admin-only endpoint to trigger a Loot Drop notification in Discord.
// POST /api/admin/loot-drop  { productId: string }

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendLootDropEmbed } from "@/lib/discord-bot";
import { z } from "zod";

const schema = z.object({ productId: z.string().min(1) });

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const product = await prisma.product.findUnique({
    where: { id: parsed.data.productId },
    select: { name: true, description: true, priceSek: true, imageUrl: true },
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  await sendLootDropEmbed(product);

  return NextResponse.json({ ok: true });
}
