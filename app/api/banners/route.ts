import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public endpoint — returns all active banners for the profile banner selector
export async function GET() {
  const banners = await prisma.banner.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { key: true, label: true, style: true, imageUrl: true, isPremiumOnly: true },
  });
  return NextResponse.json(banners);
}
