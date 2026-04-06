import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { purchaseShopItem } from "@/lib/loot-shop";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Inte inloggad" }, { status: 401 });
  }

  let shopItemId: string;
  try {
    const body = await request.json();
    shopItemId = body.shopItemId;
    if (!shopItemId) throw new Error();
  } catch {
    return NextResponse.json({ error: "Ogiltigt request" }, { status: 400 });
  }

  const result = await purchaseShopItem(session.user.id, shopItemId);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ orderId: result.orderId });
}
