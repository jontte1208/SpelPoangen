import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return null;
  return session;
}

// GET /api/admin/unlock-item?userId=xxx — fetch user's unlocked banner keys
export async function GET(req: NextRequest) {
  if (!await requireAdmin()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId krävs" }, { status: 400 });
  }

  const unlocked = await prisma.userBanner.findMany({
    where: { userId },
    select: { bannerKey: true },
  });

  return NextResponse.json({ unlockedBannerKeys: unlocked.map((u) => u.bannerKey) });
}

// POST /api/admin/unlock-item — manually unlock a banner for a user (no coin deduction)
const schema = z.object({
  userId: z.string().min(1),
  bannerKey: z.string().min(1),
});

export async function POST(request: Request) {
  if (!await requireAdmin()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { userId, bannerKey } = parsed.data;

  // Verify user exists
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) {
    return NextResponse.json({ error: "Användaren hittades inte" }, { status: 404 });
  }

  // Verify banner exists
  const banner = await prisma.banner.findUnique({ where: { key: bannerKey }, select: { key: true } });
  if (!banner) {
    return NextResponse.json({ error: "Bannern hittades inte" }, { status: 404 });
  }

  // Upsert — idempotent, no duplicate
  await prisma.userBanner.upsert({
    where: { userId_bannerKey: { userId, bannerKey } },
    create: { userId, bannerKey },
    update: {},
  });

  return NextResponse.json({ success: true });
}
