export type Tier = "ROOKIE" | "GRINDER" | "VETERAN" | "LEGEND" | "PREMIUM" | "GOLD" | "FREE";

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
  ROOKIE: "Rookie (LVL 1)",
  GRINDER: "Grinder (LVL 10+)",
  VETERAN: "Veteran (LVL 25+)",
  LEGEND: "Legend (LVL 50+)",
  PREMIUM: "Premium Pass",
  GOLD: "Gold",
  FREE: "Free",
};

export const TIER_COLORS: Record<Tier, string> = {
  ROOKIE: "text-white",
  GRINDER: "text-green-400",
  VETERAN: "text-orange-400",
  LEGEND: "text-yellow-400",
  PREMIUM: "text-yellow-300",
  GOLD: "text-yellow-500",
  FREE: "text-slate-400",
};
