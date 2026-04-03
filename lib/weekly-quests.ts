// Shared quest definitions used by both the UI and the Discord bot.
// Icons are NOT included here — the React component adds them via ICON_MAP.

export type QuestData = {
  id: string;
  title: string;
  description: string;
  xp: number;
  goal: number;
  image: string;
};

export const QUEST_POOL: QuestData[] = [
  {
    id: "forum-warrior",
    title: "Forum-krigaren",
    description: "Skriv 5 inlägg i forumet och visa att du hör hemma här.",
    xp: 150,
    goal: 5,
    image: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800&q=80",
  },
  {
    id: "social-gaming",
    title: "Social Gaming",
    description: "Bjud in en vän till SpelPoängen och dela loot-jakten.",
    xp: 200,
    goal: 1,
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80",
  },
  {
    id: "loot-scout",
    title: "Loot-spanaren",
    description: "Besök 3 olika produkter i butiken och hitta ditt nästa köp.",
    xp: 50,
    goal: 3,
    image: "https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=800&q=80",
  },
  {
    id: "squad-up",
    title: "Squad Up",
    description: "Hitta tre spelare att köra med via forumet.",
    xp: 175,
    goal: 3,
    image: "https://images.unsplash.com/photo-1605647540924-852290f6b0d5?w=800&q=80",
  },
  {
    id: "gear-check",
    title: "Gear Check",
    description: "Kolla in 5 produkter i butiken — uppgradera din setup.",
    xp: 75,
    goal: 5,
    image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&q=80",
  },
  {
    id: "grind-session",
    title: "Grind Session",
    description: "Logga in 3 dagar i rad och håll streaken vid liv.",
    xp: 100,
    goal: 3,
    image: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&q=80",
  },
];

export function getWeekIndex(): number {
  const EPOCH_MONDAY = 4 * 24 * 60 * 60 * 1000;
  return Math.floor((Date.now() - EPOCH_MONDAY) / (7 * 24 * 60 * 60 * 1000));
}

export function seededShuffle<T>(arr: T[], seed: number): T[] {
  const copy = [...arr];
  let s = seed;
  for (let i = copy.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function getActiveQuests(): QuestData[] {
  return seededShuffle(QUEST_POOL, getWeekIndex()).slice(0, 3);
}
