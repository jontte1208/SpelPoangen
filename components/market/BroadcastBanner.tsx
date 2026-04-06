"use client";

import { Megaphone } from "lucide-react";
import { useEffect, useState } from "react";

export default function BroadcastBanner() {
  const [message, setMessage] = useState("");
  const [active, setActive] = useState(false);

  useEffect(() => {
    async function fetch_() {
      try {
        const res = await fetch("/api/broadcast", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        const isActive = Boolean(data?.isActive && typeof data?.message === "string" && data.message.trim().length > 0);
        setActive(isActive);
        setMessage(isActive ? data.message : "");
      } catch {}
    }
    fetch_();
    const poll = setInterval(fetch_, 10000);
    return () => clearInterval(poll);
  }, []);

  if (!active) return null;

  return (
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
            {message}
          </p>
        </div>
      </div>
    </section>
  );
}
