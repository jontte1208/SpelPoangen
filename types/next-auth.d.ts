import type { Tier } from "@/types/user";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      xp: number;
      coins: number;
      gold: number;
      streak: number;
      level: number;
      tier: Tier;
      affiliateCode?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    discordId?: string;
    xp?: number;
    coins?: number;
    gold?: number;
    streak?: number;
    level?: number;
    tier?: Tier;
    affiliateCode?: string;
  }
}
