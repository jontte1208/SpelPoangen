"use client";

import { motion } from "framer-motion";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";

export default function HomePage() {
  const { data: session } = useSession();

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl"
      >
        <h1 className="font-display text-5xl sm:text-7xl font-bold tracking-widest mb-4 animate-glow text-neon-cyan">
          SPELPOÄNGEN
        </h1>
        <p className="text-slate-400 text-lg mb-10">
          Earn XP. Unlock rewards. Level up your gaming setup.
        </p>

        {session ? (
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/dashboard"
              className="px-6 py-3 rounded-lg bg-neon-cyan text-black font-semibold shadow-neon hover:opacity-90 transition-opacity"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/shop"
              className="px-6 py-3 rounded-lg border border-neon-cyan text-neon-cyan font-semibold hover:bg-neon-cyan/10 transition-colors"
            >
              Browse Shop
            </Link>
          </div>
        ) : (
          <button
            onClick={() => signIn("discord")}
            className="px-8 py-4 rounded-lg bg-[#5865F2] text-white font-semibold text-lg shadow-card hover:opacity-90 transition-opacity flex items-center gap-3 mx-auto"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.04.036.05A19.9 19.9 0 0 0 5.993 20.9a.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
            </svg>
            Sign in with Discord
          </button>
        )}
      </motion.div>
    </main>
  );
}
