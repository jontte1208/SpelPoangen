import { prisma } from "@/lib/prisma";
import { sendMemberJoinAnnouncement } from "@/lib/discord-bot";

const DISCORD_API = "https://discord.com/api/v10";
const JOIN_WATCH_EVENT_KEY = "DISCORD_JOIN_LAST_ANNOUNCED";
const DEFAULT_JOIN_CHANNEL_ID = "1489720997509595177";

type DiscordMember = {
  joined_at?: string;
  user?: {
    id?: string;
    username?: string;
    global_name?: string | null;
    avatar?: string | null;
    bot?: boolean;
  };
};

async function fetchGuildMembers(guildId: string, botToken: string): Promise<DiscordMember[]> {
  const members: DiscordMember[] = [];
  let after = "0";
  let pages = 0;

  while (pages < 20) {
    const res = await fetch(
      `${DISCORD_API}/guilds/${guildId}/members?limit=1000&after=${after}`,
      {
        headers: { Authorization: `Bot ${botToken}` },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      throw new Error(`Discord members fetch failed (${res.status}): ${await res.text()}`);
    }

    const batch = (await res.json()) as DiscordMember[];
    if (!Array.isArray(batch) || batch.length === 0) break;

    members.push(...batch);
    after = batch[batch.length - 1]?.user?.id ?? after;
    pages += 1;

    if (batch.length < 1000) break;
  }

  return members;
}

export async function runDiscordJoinSync() {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID;
  const joinChannelId = process.env.DISCORD_MEMBER_JOIN_CHANNEL_ID ?? DEFAULT_JOIN_CHANNEL_ID;

  if (!botToken || !guildId) {
    throw new Error("Missing DISCORD_BOT_TOKEN or DISCORD_GUILD_ID");
  }

  const state = await prisma.globalEvent.findUnique({
    where: { eventKey: JOIN_WATCH_EVENT_KEY },
    select: { endsAt: true },
  });

  const members = await fetchGuildMembers(guildId, botToken);
  const now = new Date();

  if (!state) {
    await prisma.globalEvent.create({
      data: { eventKey: JOIN_WATCH_EVENT_KEY, endsAt: now },
    });

    return {
      ok: true,
      initialized: true,
      announced: 0,
      scannedMembers: members.length,
      checkpoint: now.toISOString(),
      channelId: joinChannelId,
    };
  }

  const checkpoint = state.endsAt ?? new Date(0);

  const newMembers = members
    .filter((m) => {
      if (!m.joined_at || !m.user?.id || m.user?.bot) return false;
      const joinedAt = new Date(m.joined_at);
      if (Number.isNaN(joinedAt.getTime())) return false;
      return joinedAt.getTime() > checkpoint.getTime();
    })
    .sort((a, b) => {
      const aTs = new Date(a.joined_at ?? 0).getTime();
      const bTs = new Date(b.joined_at ?? 0).getTime();
      return aTs - bTs;
    });

  let latestAnnouncedAt = checkpoint;
  let announced = 0;

  for (const member of newMembers) {
    const discordId = member.user?.id;
    const username = member.user?.global_name || member.user?.username || "Ny medlem";
    const joinedAt = member.joined_at;

    if (!discordId || !joinedAt) continue;

    await sendMemberJoinAnnouncement({
      discordId,
      username,
      avatarHash: member.user?.avatar ?? null,
      joinedAt,
      channelId: joinChannelId,
    });

    const joinedDate = new Date(joinedAt);
    if (joinedDate.getTime() > latestAnnouncedAt.getTime()) {
      latestAnnouncedAt = joinedDate;
    }
    announced += 1;
  }

  if (latestAnnouncedAt.getTime() !== checkpoint.getTime()) {
    await prisma.globalEvent.upsert({
      where: { eventKey: JOIN_WATCH_EVENT_KEY },
      create: { eventKey: JOIN_WATCH_EVENT_KEY, endsAt: latestAnnouncedAt },
      update: { endsAt: latestAnnouncedAt },
    });
  }

  return {
    ok: true,
    initialized: false,
    announced,
    scannedMembers: members.length,
    checkpoint: latestAnnouncedAt.toISOString(),
    channelId: joinChannelId,
  };
}
