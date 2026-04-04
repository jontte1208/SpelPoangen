"use client";

import { useEffect, useState } from "react";
import { Trophy, CheckCircle2, ShoppingCart, Zap } from "lucide-react";

type ActivityType = "forum_post" | "quest_claim" | "affiliate_click" | "purchase";

type Item = {
  id: string;
  type: ActivityType;
  text: string;
  createdAt: string;
  actorImage: string | null;
};

function timeAgo(iso: string) {
  const diff = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (diff < 60) return "nu";
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
  return `${Math.floor(diff / 86400)} d`;
}

function icon(type: ActivityType) {
  if (type === "forum_post") return { Icon: Trophy, cls: "text-neon-cyan", bg: "border-neon-cyan/20 bg-neon-cyan/10" };
  if (type === "quest_claim") return { Icon: CheckCircle2, cls: "text-violet-400", bg: "border-violet-400/20 bg-violet-400/10" };
  if (type === "purchase") return { Icon: ShoppingCart, cls: "text-amber-300", bg: "border-amber-300/20 bg-amber-400/10" };
  return { Icon: Zap, cls: "text-yellow-400", bg: "border-yellow-400/20 bg-yellow-400/10" };
}

export function ProfileActivity({ userId }: { userId: string }) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/activity/recent?userId=${userId}&limit=8`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setItems(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  return (
    <section className="glass-panel rounded-[1.75rem] bg-slate-900/40 p-6">
      <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.34em] text-slate-400">
        Senaste Aktivitet
      </h2>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[52px] animate-pulse rounded-xl border border-white/5 bg-white/[0.03]" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-500">Ingen aktivitet ännu.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => {
            const { Icon, cls, bg } = icon(item.type);
            return (
              <li key={item.id} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3">
                <div className="relative shrink-0">
                  {item.actorImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.actorImage} alt="" className="h-8 w-8 rounded-full object-cover border border-white/10" />
                  ) : (
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full border ${bg}`}>
                      <Icon size={14} className={cls} />
                    </div>
                  )}
                  <div className={`absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border border-slate-900 ${bg}`}>
                    <Icon size={9} className={cls} />
                  </div>
                </div>
                <p className="min-w-0 flex-1 truncate text-sm text-slate-300">{item.text}</p>
                <span className="shrink-0 text-[10px] uppercase tracking-[0.16em] text-slate-600">
                  {timeAgo(item.createdAt)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
