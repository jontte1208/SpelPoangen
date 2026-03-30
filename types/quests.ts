export interface Quest {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  iconUrl: string | null;
  isActive: boolean;
}

export interface UserQuestStatus {
  quest: Quest;
  completed: boolean;
  completedAt: Date | null;
}

export type QuestTrigger =
  | "first_login"
  | "affiliate_click"
  | "purchase_made"
  | "profile_complete"
  | "referral_signup"
  | "reach_level_5"
  | "reach_level_10";

export interface QuestCompletionEvent {
  userId: string;
  trigger: QuestTrigger;
  metadata?: Record<string, unknown>;
}
