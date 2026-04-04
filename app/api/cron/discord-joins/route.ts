import { NextResponse } from "next/server";
import { runDiscordJoinSync } from "@/lib/discord-join-sync";

function cronAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const auth = request.headers.get("authorization") || "";
  const headerSecret = request.headers.get("x-cron-secret") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  return token === secret || headerSecret === secret;
}

async function runDiscordJoinCheck(request: Request) {
  if (!cronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runDiscordJoinSync();
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return runDiscordJoinCheck(request);
}

export async function POST(request: Request) {
  return runDiscordJoinCheck(request);
}
