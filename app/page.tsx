"use client";

import LootMarketSection from "@/components/market/LootMarketSection";
import { Megaphone } from "lucide-react";
import { useEffect, useState } from "react";

export default function HomePage() {
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastActive, setBroadcastActive] = useState(false);

  useEffect(() => {
    async function fetchBroadcast() {
      try {
        const res = await fetch("/api/broadcast", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        const active = Boolean(data?.isActive && typeof data?.message === "string" && data.message.trim().length > 0);
        setBroadcastActive(active);
        setBroadcastMessage(active ? data.message : "");
      } catch {
        // Ignore fetch errors to avoid interrupting home page rendering.
      }
    }

    fetchBroadcast();
    const poll = setInterval(fetchBroadcast, 10000);
    return () => clearInterval(poll);
  }, []);

  return (
    <main className="min-h-screen bg-[#020617] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {broadcastActive && (
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-fuchsia-300/30 bg-fuchsia-500/10 px-3 py-2 text-fuchsia-100 shadow-[0_0_20px_rgba(217,70,239,0.25)]">
            <Megaphone size={14} className="shrink-0 text-fuchsia-200" />
            <p className="text-xs font-semibold tracking-[0.02em]">{broadcastMessage}</p>
          </div>
        )}

        <LootMarketSection />
      </div>
    </main>
  );
}
