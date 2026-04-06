import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const items = await prisma.shopItem.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        name: true,
        description: true,
        coinCost: true,
        stock: true,
        category: true,
        imageUrl: true,
        sortOrder: true,
      },
    });
    return NextResponse.json(items);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
