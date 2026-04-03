import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getWeeklyQuestStatus, claimWeeklyQuest } from "@/lib/quest-system";
import { prisma } from "@/lib/prisma";
import { sendLevelUpAnnouncement } from "@/lib/discord-bot";
import { z } from "zod";

const schema = z.object({
  questId: z.string().min(1),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const result = await claimWeeklyQuest(session.user.id, parsed.data.questId);

  if (!result.success) {
    const status = result.error === "Already claimed" ? 409 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  // Discord level up announcement — fire and forget
  if (result.didLevelUp) {
    prisma.user
      .findUnique({ where: { id: session.user.id }, select: { name: true, discordId: true } })
      .then((u) =>
        sendLevelUpAnnouncement(u?.name ?? "Anonym", result.newLevel, u?.discordId)
      )
      .catch(() => {});
  }

  return NextResponse.json(result);
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const quests = await getWeeklyQuestStatus(session.user.id);
  return NextResponse.json({ quests });
}
