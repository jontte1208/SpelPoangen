"use client";

import { motion } from "framer-motion";

interface XPBarProps {
  progress: number; // 0–100
}

export default function XPBar({ progress }: XPBarProps) {
  return (
    <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden">
      <motion.div
        className="h-full rounded-full bg-neon-cyan shadow-neon"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </div>
  );
}
