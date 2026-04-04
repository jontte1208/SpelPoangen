import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { runDiscordJoinSync } from "@/lib/discord-join-sync";
import { sendMemberJoinAnnouncement } from "@/lib/discord-bot";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let sendTestPing = false;
  try {
    const body = await request.json();
    sendTestPing = Boolean(body?.sendTestPing);
  } catch {
    // no-op if request has no json body
  }

  try {
    if (sendTestPing) {
      await sendMemberJoinAnnouncement({
        discordId: session.user.id,
        username: `${session.user.name ?? "Admin"} (test)`,
        joinedAt: new Date().toISOString(),
      });
    }

    const result = await runDiscordJoinSync();
    return NextResponse.json({
      ...result,
      testPingSent: sendTestPing,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
