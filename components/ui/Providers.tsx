"use client";

import { SessionProvider } from "next-auth/react";
import { AnimatePresence } from "framer-motion";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AnimatePresence mode="wait">{children}</AnimatePresence>
    </SessionProvider>
  );
}
