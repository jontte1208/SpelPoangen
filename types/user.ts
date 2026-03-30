import { Tier } from "@prisma/client";

export interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  xp: number;
  level: number;
  tier: Tier;
  affiliateCode: string | null;
  createdAt: Date;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string | null;
  image: string | null;
  xp: number;
  level: number;
  tier: Tier;
}

export const TIER_LABELS: Record<Tier, string> = {
  FREE: "Rookie",
  GOLD: "Gold",
  PREMIUM: "Legend",
};

export const TIER_COLORS: Record<Tier, string> = {
  FREE: "text-slate-400",
  GOLD: "text-yellow-400",
  PREMIUM: "text-purple-400",
};
