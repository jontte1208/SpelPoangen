import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatSEK(amount: number): string {
  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function xpForLevel(level: number): number {
  // Keep this in sync with lib/gamification.ts (xpThreshold).
  if (level <= 1) return 0;
  return Math.floor(500 * Math.pow(level - 1, 2));
}
