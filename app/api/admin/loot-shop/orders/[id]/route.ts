import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "FULFILLED", "CANCELLED"]).optional(),
  redemptionCode: z.string().optional().nullable(),
  adminNote: z.string().optional().nullable(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.status === "FULFILLED") {
    data.fulfilledAt = new Date();
  }

  // If cancelled, refund coins
  if (parsed.data.status === "CANCELLED") {
    const order = await prisma.order.findUnique({ where: { id } });
    if (order && order.status !== "CANCELLED") {
      await prisma.user.update({
        where: { id: order.userId },
        data: { coins: { increment: order.coinsSpent } },
      });
    }
  }

  const order = await prisma.order.update({ where: { id }, data });
  return NextResponse.json(order);
}
