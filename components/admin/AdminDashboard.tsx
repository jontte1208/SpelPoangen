"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Users,
  Zap,
  Ban,
  CheckCircle,
  X,
  ChevronUp,
  ChevronDown,
  Loader2,
  Activity,
  Coins,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

type AdminUser = {
  id: string;
  name: string | null;
  image: string | null;
  discordId: string | null;
  xp: number;
  coins: number;
  gold: number;
  level: number;
  tier: string;
  role: string;
  isBanned: boolean;
  createdAt: string;
};

type EditModal = { user: AdminUser; xpDelta: string; coinsDelta: string };

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-slate-900/60 px-4 py-3 backdrop-blur-sm">
      <div className={cn("rounded-xl p-2", color)}>
        <Icon size={16} className="text-white" />
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">{label}</p>
        <p className="text-sm font-semibold text-white">{value}</p>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState<EditModal | null>(null);
  const [saving, setSaving] = useState(false);
  const [doubleXP, setDoubleXP] = useState(false);
  const [doubleXPTimer, setDoubleXPTimer] = useState<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data) => {
        setUsers(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function startDoubleXP() {
    if (doubleXP) {
      setDoubleXP(false);
      setDoubleXPTimer(0);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    setDoubleXP(true);
    setDoubleXPTimer(3600);
    timerRef.current = setInterval(() => {
      setDoubleXPTimer((t) => {
        if (t <= 1) {
          setDoubleXP(false);
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  function formatTimer(secs: number) {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  async function saveStats() {
    if (!editModal) return;
    setSaving(true);
    const xpDelta = parseInt(editModal.xpDelta) || 0;
    const coinsDelta = parseInt(editModal.coinsDelta) || 0;
    const res = await fetch(`/api/admin/users/${editModal.user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ xpDelta, coinsDelta }),
    });
    if (res.ok) {
      const updated = await res.json();
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editModal.user.id
            ? { ...u, xp: updated.xp, coins: updated.coins }
            : u
        )
      );
    }
    setSaving(false);
    setEditModal(null);
  }

  async function toggleBan(user: AdminUser) {
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ban: !user.isBanned }),
    });
    if (res.ok) {
      const updated = await res.json();
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, isBanned: updated.isBanned } : u
        )
      );
    }
  }

  const totalXP = users.reduce((s, u) => s + u.xp, 0);
  const banned = users.filter((u) => u.isBanned).length;

  return (
    <div className="min-h-screen bg-[#010b17] px-4 pb-12 pt-0 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="sticky top-0 z-40 mb-8 border-b border-white/5 bg-[#010b17]/80 py-5 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-neon-cyan/30 bg-neon-cyan/10">
              <Shield size={18} className="text-neon-cyan" />
            </div>
            <div>
              <h1 className="font-display text-lg font-semibold tracking-[0.2em] text-white">
                ADMIN PANEL
              </h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                Command Center
              </p>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="mb-8 flex flex-wrap gap-3">
          <StatCard icon={Users} label="Användare" value={users.length} color="bg-blue-500/20" />
          <StatCard icon={Star} label="Total XP" value={totalXP.toLocaleString()} color="bg-neon-cyan/20" />
          <StatCard icon={Coins} label="Aktiva" value={users.length - banned} color="bg-emerald-500/20" />
          <StatCard icon={Ban} label="Bannade" value={banned} color="bg-red-500/20" />
        </div>

        {/* Global Events */}
        <div className="mb-8 rounded-2xl border border-white/5 bg-slate-900/50 p-5 backdrop-blur-sm">
          <div className="mb-4 flex items-center gap-2">
            <Activity size={15} className="text-neon-cyan" />
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
              Server Events
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={startDoubleXP}
              className={cn(
                "flex items-center gap-2.5 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all duration-200",
                doubleXP
                  ? "border-yellow-400/40 bg-yellow-400/10 text-yellow-300 shadow-[0_0_16px_rgba(250,204,21,0.2)]"
                  : "border-white/10 bg-white/5 text-slate-300 hover:border-neon-cyan/30 hover:text-white"
              )}
            >
              <Zap size={15} className={doubleXP ? "text-yellow-300" : "text-slate-400"} />
              {doubleXP ? (
                <span>Double XP aktiv — {formatTimer(doubleXPTimer)} kvar</span>
              ) : (
                <span>Starta Double XP (1h)</span>
              )}
            </button>
          </div>
        </div>

        {/* Users table */}
        <div className="rounded-2xl border border-white/5 bg-slate-900/50 backdrop-blur-sm">
          <div className="border-b border-white/5 px-5 py-4">
            <div className="flex items-center gap-2">
              <Users size={15} className="text-neon-cyan" />
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                Användarlista
              </h2>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={22} className="animate-spin text-neon-cyan/50" />
            </div>
          ) : users.length === 0 ? (
            <p className="py-16 text-center text-sm text-slate-500">Inga användare hittades.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-left">
                    {["Användare", "Level", "XP", "Coins", "Tier", "Status", "Åtgärder"].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className={cn(
                        "border-b border-white/5 transition-colors last:border-0 hover:bg-white/[0.02]",
                        user.isBanned && "opacity-50"
                      )}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          {user.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={user.image}
                              alt={user.name ?? ""}
                              className="h-7 w-7 rounded-lg border border-white/10 object-cover"
                            />
                          ) : (
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-slate-800 text-[10px] font-bold text-slate-400">
                              {(user.name ?? "?")[0]?.toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-white">{user.name ?? "Okänd"}</p>
                            {user.role === "ADMIN" && (
                              <span className="text-[9px] uppercase tracking-[0.15em] text-neon-cyan">
                                Admin
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-slate-300">{user.level}</td>
                      <td className="px-5 py-3.5 font-mono text-slate-300">{user.xp.toLocaleString()}</td>
                      <td className="px-5 py-3.5 font-mono text-slate-300">{user.coins.toLocaleString()}</td>
                      <td className="px-5 py-3.5">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em]",
                            user.tier === "PREMIUM" && "bg-purple-500/15 text-purple-400",
                            user.tier === "GOLD" && "bg-yellow-500/15 text-yellow-400",
                            user.tier === "FREE" && "bg-slate-500/15 text-slate-400"
                          )}
                        >
                          {user.tier}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {user.isBanned ? (
                          <span className="flex items-center gap-1 text-[11px] text-red-400">
                            <Ban size={11} /> Bannad
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                            <CheckCircle size={11} /> Aktiv
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              setEditModal({ user, xpDelta: "", coinsDelta: "" })
                            }
                            className="rounded-lg border border-neon-cyan/20 bg-neon-cyan/5 px-3 py-1.5 text-[11px] font-semibold text-neon-cyan transition-all hover:border-neon-cyan/40 hover:bg-neon-cyan/10"
                          >
                            Redigera
                          </button>
                          <button
                            onClick={() => toggleBan(user)}
                            className={cn(
                              "rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition-all",
                              user.isBanned
                                ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400 hover:border-emerald-500/40 hover:bg-emerald-500/10"
                                : "border-red-500/20 bg-red-500/5 text-red-400 hover:border-red-500/40 hover:bg-red-500/10"
                            )}
                          >
                            {user.isBanned ? "Unbanna" : "Banna"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit Stats Modal */}
      <AnimatePresence>
        {editModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && setEditModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#010f1e] p-6 shadow-2xl"
            >
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-white">Redigera stats</h3>
                  <p className="text-xs text-slate-500">{editModal.user.name ?? "Okänd"}</p>
                </div>
                <button
                  onClick={() => setEditModal(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="mb-4 grid grid-cols-2 gap-3 rounded-xl border border-white/5 bg-slate-900/50 p-3 text-center text-xs">
                <div>
                  <p className="text-slate-500">Nuvarande XP</p>
                  <p className="font-mono font-semibold text-white">{editModal.user.xp.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-slate-500">Nuvarande Coins</p>
                  <p className="font-mono font-semibold text-white">{editModal.user.coins.toLocaleString()}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="mb-1.5 block text-[11px] uppercase tracking-[0.18em] text-slate-400">
                    XP (+ lägga till / - ta bort)
                  </label>
                  <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2">
                    <input
                      type="number"
                      value={editModal.xpDelta}
                      onChange={(e) =>
                        setEditModal((m) => m && { ...m, xpDelta: e.target.value })
                      }
                      placeholder="t.ex. 500 eller -200"
                      className="flex-1 bg-transparent text-sm text-white placeholder-slate-600 outline-none"
                    />
                    <div className="flex flex-col">
                      <button onClick={() => setEditModal((m) => m && { ...m, xpDelta: String((parseInt(m.xpDelta) || 0) + 100) })}>
                        <ChevronUp size={13} className="text-slate-500 hover:text-white" />
                      </button>
                      <button onClick={() => setEditModal((m) => m && { ...m, xpDelta: String((parseInt(m.xpDelta) || 0) - 100) })}>
                        <ChevronDown size={13} className="text-slate-500 hover:text-white" />
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] uppercase tracking-[0.18em] text-slate-400">
                    Coins (+ lägga till / - ta bort)
                  </label>
                  <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2">
                    <input
                      type="number"
                      value={editModal.coinsDelta}
                      onChange={(e) =>
                        setEditModal((m) => m && { ...m, coinsDelta: e.target.value })
                      }
                      placeholder="t.ex. 100 eller -50"
                      className="flex-1 bg-transparent text-sm text-white placeholder-slate-600 outline-none"
                    />
                    <div className="flex flex-col">
                      <button onClick={() => setEditModal((m) => m && { ...m, coinsDelta: String((parseInt(m.coinsDelta) || 0) + 50) })}>
                        <ChevronUp size={13} className="text-slate-500 hover:text-white" />
                      </button>
                      <button onClick={() => setEditModal((m) => m && { ...m, coinsDelta: String((parseInt(m.coinsDelta) || 0) - 50) })}>
                        <ChevronDown size={13} className="text-slate-500 hover:text-white" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex gap-2">
                <button
                  onClick={() => setEditModal(null)}
                  className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-slate-400 hover:bg-white/5"
                >
                  Avbryt
                </button>
                <button
                  onClick={saveStats}
                  disabled={saving}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-neon-cyan/30 bg-neon-cyan/10 py-2.5 text-sm font-semibold text-neon-cyan transition-all hover:bg-neon-cyan/20 disabled:opacity-50"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                  Spara
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
