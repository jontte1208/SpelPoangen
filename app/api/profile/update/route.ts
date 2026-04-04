import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BANNER_KEYS } from "@/lib/banners";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { bannerKey, customImage } = await req.json();

  if (bannerKey !== undefined && !BANNER_KEYS.includes(bannerKey)) {
    return NextResponse.json({ error: "Invalid banner" }, { status: 400 });
  }

  // Basic URL validation if customImage is provided
  if (customImage !== undefined && customImage !== null && customImage !== "") {
    try {
      new URL(customImage);
    } catch {
      return NextResponse.json({ error: "Invalid image URL" }, { status: 400 });
    }
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(bannerKey !== undefined && { bannerKey }),
      ...(customImage !== undefined && { customImage: customImage || null }),
    },
  });

  return NextResponse.json({ ok: true });
}
