"use client";

import { motion } from "framer-motion";

interface XPBarProps {
  progress: number; // 0–100
}

export default function XPBar({ progress }: XPBarProps) {
  return (
    <div className="w-full h-4 overflow-hidden rounded-full border border-cyan-400/15 bg-slate-950/80 p-[3px]">
      <motion.div
        className="h-full rounded-full bg-[linear-gradient(90deg,#00f5ff_0%,#38bdf8_50%,#2563eb_100%)] shadow-neon animate-pulse-neon"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </div>
  );
}
