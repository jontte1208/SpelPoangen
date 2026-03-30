import { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { prisma } from "@/lib/prisma";
import type { Tier } from "@/types/user";

export const authOptions: NextAuthOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: { params: { scope: "identify email guilds" } },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    async jwt({ token, profile }) {
      if (profile && "id" in profile) {
        token.discordId = String(profile.id);
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
            xp: true,
            coins: true,
            gold: true,
            streak: true,
            level: true,
            tier: true,
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
          token.affiliateCode = dbUser.affiliateCode ?? token.affiliateCode;
        }
      } catch {
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
        session.user.affiliateCode =
          typeof token.affiliateCode === "string" ? token.affiliateCode : undefined;
      }
      return session;
    },
  },
};
