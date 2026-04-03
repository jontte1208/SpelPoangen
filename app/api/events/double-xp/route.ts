import { NextResponse } from "next/server";
import { getDoubleXPStatus } from "@/lib/global-events";

export async function GET() {
  const status = await getDoubleXPStatus();
  return NextResponse.json(status);
}
