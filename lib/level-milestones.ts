// Shared level milestone definitions.
// Used by: Discord role sync, admin panel badge, platform header badge.

export type LevelMilestone = {
  level: number;        // minimum level to earn this milestone
  label: string;        // display name (matches Discord role name)
  emoji: string;
  discordEnvKey: string;
  // Tailwind classes for badge styling
  textColor: string;
  bgColor: string;
  borderColor: string;
};

export const LEVEL_MILESTONES: LevelMilestone[] = [
  {
    level: 1,
    label: "ROOKIE",
    emoji: "🟣",
    discordEnvKey: "DISCORD_LEVEL_1_ROLE_ID",
    textColor: "text-violet-400",
    bgColor: "bg-violet-500/15",
    borderColor: "border-violet-500/30",
  },
  {
    level: 10,
    label: "GRINDER",
    emoji: "⚔️",
    discordEnvKey: "DISCORD_LEVEL_10_ROLE_ID",
    textColor: "text-green-400",
    bgColor: "bg-green-500/15",
    borderColor: "border-green-500/30",
  },
  {
    level: 25,
    label: "VETERAN",
    emoji: "🔥",
    discordEnvKey: "DISCORD_LEVEL_25_ROLE_ID",
    textColor: "text-orange-400",
    bgColor: "bg-orange-500/15",
    borderColor: "border-orange-500/30",
  },
  {
    level: 50,
    label: "LEGEND",
    emoji: "💎",
    discordEnvKey: "DISCORD_LEVEL_50_ROLE_ID",
    textColor: "text-amber-400",
    bgColor: "bg-amber-500/15",
    borderColor: "border-amber-500/30",
  },
];

/** Returns the highest milestone the user has reached. */
export function getLevelMilestone(level: number): LevelMilestone {
  const reached = LEVEL_MILESTONES.filter((m) => level >= m.level);
  return reached[reached.length - 1] ?? LEVEL_MILESTONES[0];
}
