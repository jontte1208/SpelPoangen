import { PrismaAdapter } from "@auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { prisma } from "@/lib/prisma";
import type { Tier } from "@/types/user";

function toErrorMeta(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    message: String(error),
  };
}

function getAdminDiscordIds() {
  const values = [
    process.env.ADMIN_DISCORD_ID,
    process.env.ADMIN_DISCORD_IDS,
    process.env.OWNER_DISCORD_ID,
  ].filter((value): value is string => typeof value === "string" && value.length > 0);

  return new Set(
    values
      .flatMap((value) => value.split(","))
      .map((value) => value.trim())
      .filter((value) => value.length > 0)
  );
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: { params: { scope: "identify email" } },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  events: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== "discord" || !user.id) {
        return;
      }

      const discordId =
        typeof account.providerAccountId === "string"
          ? account.providerAccountId
          : profile && "id" in profile
          ? String(profile.id)
          : null;

      const isAdminDiscordId = discordId ? getAdminDiscordIds().has(discordId) : false;

      try {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            lastLogin: new Date(),
            ...(discordId ? { discordId } : {}),
            ...(isAdminDiscordId ? { role: "ADMIN" } : {}),
          },
        });
      } catch (error) {
        console.error("[auth.events.signIn] user update failed", {
          userId: user.id,
          provider: account.provider,
          discordId,
          isAdminDiscordId,
          error: toErrorMeta(error),
        });
      }
    },
  },
  callbacks: {
    async jwt({ token, profile, account, user }) {
      if (profile && "id" in profile) {
        token.discordId = String(profile.id);
      }

      if (!token.discordId && account?.provider === "discord") {
        token.discordId = account.providerAccountId;
      }

      if (user?.id) {
        token.sub = user.id;
      }

      if (!token.sub) {
        return token;
      }

      token.xp = 50;
      token.coins = 0;
      token.gold = 0;
      token.streak = 0;
      token.level = 1;
      token.tier = "FREE";
      token.role = "USER";
      token.affiliateCode = `SP-${token.sub.slice(0, 8).toUpperCase()}`;

      try {
        const dbUser = await prisma.user.findFirst({
          where: {
            OR: [
              { id: token.sub },
              token.email ? { email: token.email } : undefined,
              token.discordId ? { discordId: String(token.discordId) } : undefined,
            ].filter(Boolean) as Array<
              | { id: string }
              | { email: string }
              | { discordId: string }
            >,
          },
          select: {
            id: true,
            discordId: true,
            xp: true,
            coins: true,
            gold: true,
            streak: true,
            level: true,
            tier: true,
            role: true,
            affiliateCode: true,
          },
        });

        if (dbUser) {
          token.sub = dbUser.id;
          token.xp = dbUser.xp;
          token.coins = dbUser.coins;
          token.gold = dbUser.gold;
          token.streak = dbUser.streak;
          token.level = dbUser.level;
          token.tier = dbUser.tier;
          token.role = dbUser.role;
          token.affiliateCode = dbUser.affiliateCode ?? token.affiliateCode;

          const adminDiscordIds = getAdminDiscordIds();
          const shouldBeAdmin =
            (typeof token.discordId === "string" && adminDiscordIds.has(token.discordId)) ||
            (typeof dbUser.discordId === "string" && adminDiscordIds.has(dbUser.discordId));

          if (shouldBeAdmin && dbUser.role !== "ADMIN") {
            await prisma.user.update({
              where: { id: dbUser.id },
              data: { role: "ADMIN" },
            });
            token.role = "ADMIN";
          }
        }
      } catch (error) {
        console.error("[auth.callbacks.jwt] db lookup failed", {
          tokenSub: token.sub,
          tokenEmail: token.email,
          tokenDiscordId: token.discordId,
          error: toErrorMeta(error),
        });
        // Fall back to token defaults when the database is unavailable.
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "discord-user";
        session.user.xp = typeof token.xp === "number" ? token.xp : 50;
        session.user.coins = typeof token.coins === "number" ? token.coins : 0;
        session.user.gold = typeof token.gold === "number" ? token.gold : 0;
        session.user.streak = typeof token.streak === "number" ? token.streak : 0;
        session.user.level = typeof token.level === "number" ? token.level : 1;
        session.user.tier = (token.tier as Tier | undefined) ?? "FREE";
        session.user.role = token.role === "ADMIN" ? "ADMIN" : "USER";
        session.user.affiliateCode =
          typeof token.affiliateCode === "string" ? token.affiliateCode : undefined;
      }
      return session;
    },
  },
};
