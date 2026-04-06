export type Banner = {
  key: string;
  label: string;
  style: string;
  premium?: boolean;
};

export const BANNERS: Banner[] = [
  {
    key: "default",
    label: "Standard",
    style: "linear-gradient(135deg,#0d1f3c 0%,#051120 40%,#0a2a1f 70%,#010b17 100%)",
  },
  {
    key: "ocean",
    label: "Ocean",
    style: "linear-gradient(135deg,#0f2027 0%,#203a43 50%,#2c5364 100%)",
  },
  {
    key: "fire",
    label: "Fire",
    style: "linear-gradient(135deg,#1a0000 0%,#7f1d1d 40%,#c2410c 80%,#fbbf24 100%)",
  },
  {
    key: "purple",
    label: "Violet",
    style: "linear-gradient(135deg,#1e1b4b 0%,#4c1d95 50%,#7c3aed 100%)",
  },
  {
    key: "gold",
    label: "Gold",
    style: "linear-gradient(135deg,#1c1000 0%,#78350f 40%,#d97706 80%,#fde68a 100%)",
  },
  {
    key: "matrix",
    label: "Matrix",
    style: "linear-gradient(135deg,#000000 0%,#022c22 50%,#065f46 100%)",
  },
  {
    key: "sunset",
    label: "Sunset",
    style: "linear-gradient(135deg,#1a001a 0%,#831843 40%,#be185d 70%,#fb923c 100%)",
  },
  {
    key: "midnight",
    label: "Midnight",
    style: "linear-gradient(135deg,#020617 0%,#1e3a5f 50%,#1d4ed8 100%)",
  },
  // Premium banners — unlocked via Loot Shop
  {
    key: "aurora",
    label: "Aurora",
    style: "linear-gradient(135deg,#001a1a 0%,#00b4d8 40%,#90e0ef 70%,#caf0f8 100%)",
    premium: true,
  },
  {
    key: "neon",
    label: "Neon",
    style: "linear-gradient(135deg,#0d0221 0%,#7b00ff 40%,#ff00c8 80%,#00fff7 100%)",
    premium: true,
  },
  {
    key: "lava",
    label: "Lava",
    style: "linear-gradient(135deg,#0a0000 0%,#3d0000 30%,#ff4500 70%,#ff9800 100%)",
    premium: true,
  },
  {
    key: "galaxy",
    label: "Galaxy",
    style: "linear-gradient(135deg,#000000 0%,#0d0221 30%,#4a0080 60%,#c0392b 80%,#f39c12 100%)",
    premium: true,
  },
  {
    key: "ice",
    label: "Ice",
    style: "linear-gradient(135deg,#e0f7ff 0%,#b3ecff 30%,#4fc3f7 60%,#0288d1 100%)",
    premium: true,
  },
];

export const BANNER_KEYS = BANNERS.map((b) => b.key);
export const FREE_BANNER_KEYS = BANNERS.filter((b) => !b.premium).map((b) => b.key);

export function getBanner(key: string): Banner {
  return BANNERS.find((b) => b.key === key) ?? BANNERS[0];
}
