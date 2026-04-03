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
          <section className="mb-8 mt-8 rounded-2xl border border-fuchsia-300/35 bg-[linear-gradient(120deg,rgba(192,38,211,0.16),rgba(139,92,246,0.12))] px-5 py-4 shadow-[0_0_28px_rgba(217,70,239,0.28)] sm:mt-10">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-fuchsia-200/40 bg-fuchsia-300/15">
                <Megaphone size={18} className="text-fuchsia-100" />
              </span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-fuchsia-100/90">
                  Global Announcement
                </p>
                <p className="mt-1 text-base font-semibold leading-relaxed text-fuchsia-50 sm:text-lg">
                  {broadcastMessage}
                </p>
              </div>
            </div>
          </section>
        )}

        <LootMarketSection />
      </div>
    </main>
  );
}
