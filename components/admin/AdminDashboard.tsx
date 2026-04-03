"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Users,
  Zap,
  Ban,
  CheckCircle,
  Check,
  Copy,
  X,
  ChevronUp,
  ChevronDown,
  Loader2,
  Activity,
  Coins,
  Star,
  ArrowLeft,
  RotateCcw,
  MessageSquare,
  MousePointerClick,
  Trophy,
  Megaphone,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { getLevelMilestone } from "@/lib/level-milestones";
import AdminQuestPanel from "./AdminQuestPanel";

type AdminUser = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  discordId: string | null;
  xp: number;
  coins: number;
  gold: number;
  level: number;
  streak: number;
  tier: string;
  role: string;
  isBanned: boolean;
  affiliateCode: string | null;
  referredBy: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripeCurrentPeriodEnd: string | null;
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
  accounts: Array<{
    providerAccountId: string;
    scope: string | null;
    expires_at: number | null;
    token_type: string | null;
    hasAccessToken: boolean;
  }>;
};

type EditModal = { user: AdminUser; xpDelta: string; coinsDelta: string; tier: string };

type DetailsModal = { user: AdminUser };

type UserActivityItem = {
  id: string;
  type: "forum_post" | "quest_claim" | "product_click";
  title: string;
  description: string;
  createdAt: string;
};

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
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState<EditModal | null>(null);
  const [detailsModal, setDetailsModal] = useState<DetailsModal | null>(null);
  const [activityTimeline, setActivityTimeline] = useState<UserActivityItem[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);
  const [activitySummary, setActivitySummary] = useState<{
    lastForumPostAt: string | null;
    lastQuestClaimAt: string | null;
    lastProductClickAt: string | null;
  }>({
    lastForumPostAt: null,
    lastQuestClaimAt: null,
    lastProductClickAt: null,
  });
  const [saving, setSaving] = useState(false);
  const [resettingQuests, setResettingQuests] = useState(false);
  const [tierUpdatingUserId, setTierUpdatingUserId] = useState<string | null>(null);
  const [tierSyncStatus, setTierSyncStatus] = useState<{ [key: string]: "syncing" | "success" | "error" | null }>({});
  const [discordSyncingUserId, setDiscordSyncingUserId] = useState<string | null>(null);
  const [doubleXPEndsAt, setDoubleXPEndsAt] = useState<string | null>(null);
  const [doubleXPTimer, setDoubleXPTimer] = useState<number>(0);
  const [doubleXPUpdating, setDoubleXPUpdating] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastActive, setBroadcastActive] = useState(false);
  const [broadcastSaving, setBroadcastSaving] = useState(false);
  const [broadcastUpdatedAt, setBroadcastUpdatedAt] = useState<string | null>(null);

  const doubleXP = doubleXPTimer > 0;

  function syncDoubleXPState(endsAt: string | null) {
    setDoubleXPEndsAt(endsAt);
    if (!endsAt) {
      setDoubleXPTimer(0);
      return;
    }
    const secondsLeft = Math.max(0, Math.ceil((new Date(endsAt).getTime() - Date.now()) / 1000));
    setDoubleXPTimer(secondsLeft);
  }

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data) => {
        setUsers(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    async function fetchDoubleXPStatus() {
      try {
        const res = await fetch("/api/admin/events/double-xp", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        syncDoubleXPState(typeof data.endsAt === "string" ? data.endsAt : null);
      } catch {
        // Ignore polling errors so the admin panel remains usable.
      }
    }

    fetchDoubleXPStatus();
    const poll = setInterval(fetchDoubleXPStatus, 15000);
    return () => clearInterval(poll);
  }, []);

  useEffect(() => {
    async function fetchBroadcastStatus() {
      try {
        const res = await fetch("/api/admin/broadcast", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        setBroadcastMessage(typeof data.message === "string" ? data.message : "");
        setBroadcastActive(Boolean(data.isActive));
        setBroadcastUpdatedAt(typeof data.updatedAt === "string" ? data.updatedAt : null);
      } catch {
        // Ignore fetch errors to keep admin panel functional.
      }
    }

    fetchBroadcastStatus();
  }, []);

  useEffect(() => {
    if (!doubleXPEndsAt) {
      setDoubleXPTimer(0);
      return;
    }

    const updateCountdown = () => {
      const secondsLeft = Math.max(0, Math.ceil((new Date(doubleXPEndsAt).getTime() - Date.now()) / 1000));
      setDoubleXPTimer(secondsLeft);
      if (secondsLeft === 0) {
        setDoubleXPEndsAt(null);
      }
    };

    updateCountdown();
    const tick = setInterval(updateCountdown, 1000);
    return () => clearInterval(tick);
  }, [doubleXPEndsAt]);

  async function startDoubleXP() {
    setDoubleXPUpdating(true);

    const res = await fetch("/api/admin/events/double-xp", {
      method: doubleXP ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: doubleXP ? undefined : JSON.stringify({ durationMinutes: 60 }),
    });

    if (res.ok) {
      const data = await res.json();
      syncDoubleXPState(typeof data.endsAt === "string" ? data.endsAt : null);
    } else {
      alert("Kunde inte uppdatera Double XP-eventet");
    }

    setDoubleXPUpdating(false);
  }

  async function publishBroadcast() {
    setBroadcastSaving(true);
    const res = await fetch("/api/admin/broadcast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: broadcastMessage }),
    });

    if (res.ok) {
      const data = await res.json();
      setBroadcastMessage(typeof data.message === "string" ? data.message : "");
      setBroadcastActive(Boolean(data.isActive));
      setBroadcastUpdatedAt(typeof data.updatedAt === "string" ? data.updatedAt : null);
    } else {
      alert("Kunde inte publicera broadcast-meddelandet");
    }

    setBroadcastSaving(false);
  }

  async function clearBroadcast() {
    setBroadcastSaving(true);
    const res = await fetch("/api/admin/broadcast", { method: "DELETE" });

    if (res.ok) {
      const data = await res.json();
      setBroadcastActive(Boolean(data.isActive));
      setBroadcastMessage("");
      setBroadcastUpdatedAt(typeof data.updatedAt === "string" ? data.updatedAt : null);
    } else {
      alert("Kunde inte stänga av broadcast-meddelandet");
    }

    setBroadcastSaving(false);
  }

  function formatTimer(secs: number) {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  function formatDate(date: string | null) {
    if (!date) return "-";
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return "-";
    return parsed.toLocaleString("sv-SE");
  }

  function formatDiscordScopes(scope: string | null) {
    if (!scope) return "-";
    return scope
      .split(" ")
      .map((s) => s.trim())
      .filter(Boolean)
      .join(", ");
  }

  function getActivityIcon(type: UserActivityItem["type"]) {
    if (type === "forum_post") return MessageSquare;
    if (type === "quest_claim") return Trophy;
    return MousePointerClick;
  }

  function getActivityAccent(type: UserActivityItem["type"]) {
    if (type === "forum_post") return "text-blue-300 border-blue-400/20 bg-blue-500/10";
    if (type === "quest_claim") return "text-emerald-300 border-emerald-400/20 bg-emerald-500/10";
    return "text-amber-300 border-amber-400/20 bg-amber-500/10";
  }

  async function openDetailsModal(user: AdminUser) {
    setDetailsModal({ user });
    setActivityLoading(true);
    setActivityError(null);
    setActivityTimeline([]);
    setActivitySummary({
      lastForumPostAt: null,
      lastQuestClaimAt: null,
      lastProductClickAt: null,
    });

    try {
      const res = await fetch(`/api/admin/users/${user.id}/activity?limit=30`, { cache: "no-store" });
      if (!res.ok) {
        throw new Error("Kunde inte hämta aktivitet");
      }
      const data = await res.json();
      setActivityTimeline(Array.isArray(data.timeline) ? data.timeline : []);
      setActivitySummary({
        lastForumPostAt: typeof data.lastForumPostAt === "string" ? data.lastForumPostAt : null,
        lastQuestClaimAt: typeof data.lastQuestClaimAt === "string" ? data.lastQuestClaimAt : null,
        lastProductClickAt: typeof data.lastProductClickAt === "string" ? data.lastProductClickAt : null,
      });
    } catch {
      setActivityError("Kunde inte ladda användarens aktivitetslogg.");
    } finally {
      setActivityLoading(false);
    }
  }

  async function copyToClipboard(value: string, fieldKey: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(fieldKey);
      setTimeout(() => {
        setCopiedField((current) => (current === fieldKey ? null : current));
      }, 1500);
    } catch {
      // Silently ignore copy errors to avoid breaking admin flow.
    }
  }

  async function saveStats() {
    if (!editModal) return;
    setSaving(true);
    const xpDelta = parseInt(editModal.xpDelta) || 0;
    const coinsDelta = parseInt(editModal.coinsDelta) || 0;
    const tier = ["FREE", "ROOKIE", "GRINDER", "LEGEND", "PREMIUM", "GOLD"].includes(editModal.tier)
      ? editModal.tier
      : undefined;
    
    // Show syncing status
    setTierSyncStatus((prev) => ({ ...prev, [editModal.user.id]: "syncing" }));
    
    const res = await fetch(`/api/admin/users/${editModal.user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ xpDelta, coinsDelta, tier }),
    });
    if (res.ok) {
      const updated = await res.json();
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editModal.user.id
            ? {
                ...u,
                xp: updated.xp,
                coins: updated.coins,
                tier: typeof updated.tier === "string" ? updated.tier : u.tier,
              }
            : u
        )
      );
      setTierSyncStatus((prev) => ({ ...prev, [editModal.user.id]: "success" }));
      setTimeout(() => {
        setTierSyncStatus((prev) => ({ ...prev, [editModal.user.id]: null }));
      }, 2000);
    } else {
      setTierSyncStatus((prev) => ({ ...prev, [editModal.user.id]: "error" }));
      setTimeout(() => {
        setTierSyncStatus((prev) => ({ ...prev, [editModal.user.id]: null }));
      }, 2000);
    }
    setSaving(false);
    setEditModal(null);
  }

  async function resetWeeklyQuests() {
    if (!editModal) return;
    setResettingQuests(true);
    const res = await fetch(`/api/admin/users/${editModal.user.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      const data = await res.json();
      alert(`Nollställt ${data.deleted} quest-claims för vecka ${data.weekIndex}`);
    } else {
      alert("Kunde inte nollställa quest-claims");
    }
    setResettingQuests(false);
  }

  async function syncDiscordRoles(userId: string) {
    setDiscordSyncingUserId(userId);
    try {
      await fetch(`/api/admin/users/${userId}/sync-discord`, { method: "POST" });
    } finally {
      setDiscordSyncingUserId(null);
    }
  }

  async function setUserTier(user: AdminUser, tier: string) {
    setTierUpdatingUserId(user.id);
    setTierSyncStatus((prev) => ({ ...prev, [user.id]: "syncing" }));
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });

      if (!res.ok) {
        setTierSyncStatus((prev) => ({ ...prev, [user.id]: "error" }));
        setTimeout(() => {
          setTierSyncStatus((prev) => ({ ...prev, [user.id]: null }));
        }, 2000);
        return;
      }

      const updated = await res.json();
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? { ...u, tier: typeof updated.tier === "string" ? updated.tier : tier }
            : u
        )
      );
      setTierSyncStatus((prev) => ({ ...prev, [user.id]: "success" }));
      setTimeout(() => {
        setTierSyncStatus((prev) => ({ ...prev, [user.id]: null }));
      }, 2000);
      setDetailsModal((current) =>
        current && current.user.id === user.id
          ? {
              user: {
                ...current.user,
                tier: typeof updated.tier === "string" ? updated.tier : tier,
              },
            }
          : current
      );
    } finally {
      setTierUpdatingUserId(null);
    }
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
  const filteredUsers = users.filter((user) => {
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || [user.name, user.email, user.discordId, user.id]
      .filter(Boolean)
      .some((value) => value!.toLowerCase().includes(q));

    const matchesTier = tierFilter === "ALL" || user.tier === tierFilter;

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && !user.isBanned) ||
      (statusFilter === "BANNED" && user.isBanned);

    return matchesSearch && matchesTier && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-[#010b17] px-4 pb-12 pt-0 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="sticky top-0 z-40 mb-8 border-b border-white/5 bg-[#010b17]/80 py-5 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 transition-all hover:border-neon-cyan/30 hover:text-white"
            >
              <ArrowLeft size={16} />
            </button>
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
              disabled={doubleXPUpdating}
              className={cn(
                "flex items-center gap-2.5 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all duration-200 disabled:opacity-60",
                doubleXP
                  ? "border-yellow-400/40 bg-yellow-400/10 text-yellow-300 shadow-[0_0_16px_rgba(250,204,21,0.2)]"
                  : "border-white/10 bg-white/5 text-slate-300 hover:border-neon-cyan/30 hover:text-white"
              )}
            >
              <Zap size={15} className={doubleXP ? "text-yellow-300" : "text-slate-400"} />
              {doubleXP ? (
                <span>Double XP globalt aktiv — {formatTimer(doubleXPTimer)} kvar</span>
              ) : (
                <span>Starta Double XP (1h)</span>
              )}
            </button>
          </div>
        </div>

        <div className="mb-8 rounded-2xl border border-white/5 bg-slate-900/50 p-5 backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Megaphone size={15} className="text-neon-cyan" />
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                Global Broadcast
              </h2>
            </div>
            <span className={cn(
              "rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]",
              broadcastActive
                ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                : "border-white/10 bg-white/5 text-slate-400"
            )}>
              {broadcastActive ? "Aktiv" : "Inaktiv"}
            </span>
          </div>

          <textarea
            value={broadcastMessage}
            onChange={(e) => setBroadcastMessage(e.target.value.slice(0, 280))}
            placeholder="Skriv ett globalt meddelande till alla inloggade användare..."
            className="min-h-[84px] w-full resize-y rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-white placeholder-slate-600 outline-none transition-colors focus:border-neon-cyan/40"
          />

          <div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-slate-500">
            <span>{broadcastMessage.length}/280 tecken</span>
            <span>Senast uppdaterad: {formatDate(broadcastUpdatedAt)}</span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={publishBroadcast}
              disabled={broadcastSaving || broadcastMessage.trim().length === 0}
              className="rounded-xl border border-neon-cyan/30 bg-neon-cyan/10 px-4 py-2 text-sm font-semibold text-neon-cyan transition-all hover:bg-neon-cyan/20 disabled:opacity-50"
            >
              {broadcastSaving ? "Publicerar..." : "Publicera broadcast"}
            </button>
            <button
              onClick={clearBroadcast}
              disabled={broadcastSaving || !broadcastActive}
              className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300 transition-all hover:bg-red-500/20 disabled:opacity-50"
            >
              {broadcastSaving ? "Stänger av..." : "Stäng av broadcast"}
            </button>
          </div>
        </div>

        {/* Quest Management */}
        <div className="mb-8">
          <AdminQuestPanel />
        </div>

        {/* Users table */}
        <div className="rounded-2xl border border-white/5 bg-slate-900/50 backdrop-blur-sm">
          <div className="border-b border-white/5 px-5 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Users size={15} className="text-neon-cyan" />
                <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                  Användarlista
                </h2>
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                  {filteredUsers.length}/{users.length}
                </span>
              </div>
              <div className="grid w-full gap-2 sm:w-auto sm:grid-cols-[minmax(320px,1fr)_130px_130px]">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Sök: namn, e-post, Discord ID, User ID"
                  className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-white placeholder-slate-600 outline-none transition-colors focus:border-neon-cyan/40"
                />

                <select
                  value={tierFilter}
                  onChange={(e) => setTierFilter(e.target.value)}
                  className="rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-200 outline-none transition-colors focus:border-neon-cyan/40"
                >
                  <option value="ALL">Tier: Alla</option>
                  <option value="ROOKIE">ROOKIE (LVL 1)</option>
                  <option value="GRINDER">GRINDER (LVL 10+)</option>
                  <option value="LEGEND">LEGEND (LVL 50+)</option>
                  <option value="PREMIUM">PREMIUM PASS</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-200 outline-none transition-colors focus:border-neon-cyan/40"
                >
                  <option value="ALL">Status: Alla</option>
                  <option value="ACTIVE">Aktiv</option>
                  <option value="BANNED">Bannad</option>
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={22} className="animate-spin text-neon-cyan/50" />
            </div>
          ) : filteredUsers.length === 0 ? (
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
                  {filteredUsers.map((user) => (
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
                            <div className="flex items-center gap-1.5">
                              <p className="text-[11px] text-slate-500">{user.discordId ?? "Ingen Discord ID"}</p>
                              {user.discordId ? (
                                <button
                                  onClick={() => copyToClipboard(user.discordId!, `row-discord-id-${user.id}`)}
                                  className="rounded-md border border-white/10 bg-white/5 p-1 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
                                  title="Kopiera Discord ID"
                                >
                                  {copiedField === `row-discord-id-${user.id}` ? <Check size={10} /> : <Copy size={10} />}
                                </button>
                              ) : null}
                              <button
                                onClick={() => copyToClipboard(user.id, `row-user-id-${user.id}`)}
                                className="rounded-md border border-white/10 bg-white/5 p-1 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
                                title="Kopiera User ID"
                              >
                                {copiedField === `row-user-id-${user.id}` ? <Check size={10} /> : <Copy size={10} />}
                              </button>
                            </div>
                            {user.role === "ADMIN" && (
                              <span className="text-[9px] uppercase tracking-[0.15em] text-neon-cyan">
                                Admin
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col gap-1">
                          <span className="font-mono text-slate-300">{user.level}</span>
                          {(() => {
                            const m = getLevelMilestone(user.level);
                            return (
                              <span className={cn("rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] w-fit", m.textColor, m.bgColor, m.borderColor)}>
                                {m.emoji} {m.label}
                              </span>
                            );
                          })()}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-slate-300">{user.xp.toLocaleString()}</td>
                      <td className="px-5 py-3.5 font-mono text-slate-300">{user.coins.toLocaleString()}</td>
                      <td className="px-5 py-3.5">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em]",
                            user.tier === "LEGEND"  && "bg-amber-500/15 text-amber-400",
                            user.tier === "PREMIUM" && "bg-purple-500/15 text-purple-400",
                            user.tier === "GRINDER" && "bg-green-500/15 text-green-400",
                            user.tier === "ROOKIE"  && "bg-violet-500/15 text-violet-400",
                          )}
                        >
                          {user.tier === "PREMIUM" ? "PREMIUM PASS" : user.tier}
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
                            onClick={() => openDetailsModal(user)}
                            className="rounded-lg border border-blue-500/20 bg-blue-500/5 px-3 py-1.5 text-[11px] font-semibold text-blue-300 transition-all hover:border-blue-500/40 hover:bg-blue-500/10"
                          >
                            Visa info
                          </button>
                          <button
                            onClick={() =>
                              setEditModal({ user, xpDelta: "", coinsDelta: "", tier: user.tier })
                            }
                            className="rounded-lg border border-neon-cyan/20 bg-neon-cyan/5 px-3 py-1.5 text-[11px] font-semibold text-neon-cyan transition-all hover:border-neon-cyan/40 hover:bg-neon-cyan/10"
                          >
                            Redigera
                          </button>
                          <button
                            onClick={() => syncDiscordRoles(user.id)}
                            disabled={discordSyncingUserId === user.id}
                            title="Synca Discord-roller"
                            className="rounded-lg border border-indigo-500/20 bg-indigo-500/5 px-2 py-1.5 text-[11px] font-semibold text-indigo-300 transition-all hover:border-indigo-500/40 hover:bg-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {discordSyncingUserId === user.id ? (
                              <Loader2 size={11} className="animate-spin" />
                            ) : (
                              <RotateCcw size={11} />
                            )}
                          </button>
                            <div className="relative">
                              <select
                                value={user.tier}
                                onChange={(e) => setUserTier(user, e.target.value)}
                                disabled={tierUpdatingUserId === user.id}
                                className="rounded-lg border border-violet-500/20 bg-violet-500/5 px-3 py-1.5 text-[11px] font-semibold text-violet-300 transition-all hover:border-violet-500/40 hover:bg-violet-500/10 disabled:cursor-not-allowed disabled:opacity-50 appearance-none pr-8"
                              >
                                <option value="ROOKIE">ROOKIE (LVL 1)</option>
                                <option value="GRINDER">GRINDER (LVL 10+)</option>
                                <option value="LEGEND">LEGEND (LVL 50+)</option>
                                <option value="PREMIUM">PREMIUM PASS</option>
                              </select>
                              {tierUpdatingUserId === user.id && (
                                <Loader2 size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 animate-spin text-violet-300 pointer-events-none" />
                              )}
                            </div>
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
                    Tier / Roll
                  </label>
                  <div className="space-y-2">
                    <select
                      value={editModal.tier}
                      onChange={(e) => setEditModal((m) => m && { ...m, tier: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-neon-cyan/40"
                    >
                      <option value="ROOKIE">ROOKIE (LVL 1)</option>
                      <option value="GRINDER">GRINDER (LVL 10+)</option>
                      <option value="LEGEND">LEGEND (LVL 50+)</option>
                      <option value="PREMIUM">PREMIUM PASS</option>
                    </select>
                    {tierSyncStatus[editModal.user.id] && (
                      <div className={cn(
                        "flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium",
                        tierSyncStatus[editModal.user.id] === "syncing" && "bg-blue-500/10 text-blue-400",
                        tierSyncStatus[editModal.user.id] === "success" && "bg-green-500/10 text-green-400",
                        tierSyncStatus[editModal.user.id] === "error" && "bg-red-500/10 text-red-400"
                      )}>
                        {tierSyncStatus[editModal.user.id] === "syncing" && <Loader2 size={13} className="animate-spin" />}
                        {tierSyncStatus[editModal.user.id] === "success" && <Check size={13} />}
                        {tierSyncStatus[editModal.user.id] === "error" && <X size={13} />}
                        <span>
                          {tierSyncStatus[editModal.user.id] === "syncing" && "Synkar med Discord..."}
                          {tierSyncStatus[editModal.user.id] === "success" && "Synkad! Discord-roll uppdaterad"}
                          {tierSyncStatus[editModal.user.id] === "error" && "Sync misslyckades - Discord API fel"}
                        </span>
                      </div>
                    )}
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

              <button
                onClick={resetWeeklyQuests}
                disabled={resettingQuests}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 py-2.5 text-sm font-semibold text-amber-400 transition-all hover:bg-amber-500/20 disabled:opacity-50"
              >
                {resettingQuests ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                Nollställ veckans quests
              </button>

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

      {/* User Details Modal */}
      <AnimatePresence>
        {detailsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && setDetailsModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#010f1e] p-6 shadow-2xl"
            >
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-white">Användardetaljer</h3>
                  <p className="text-xs text-slate-500">{detailsModal.user.name ?? "Okänd"}</p>
                </div>
                <button
                  onClick={() => setDetailsModal(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-slate-900/50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">User ID</p>
                    <button
                      onClick={() => copyToClipboard(detailsModal.user.id, `details-user-id-${detailsModal.user.id}`)}
                      className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-slate-300 transition-colors hover:bg-white/10"
                    >
                      <span className="inline-flex items-center gap-1">
                        {copiedField === `details-user-id-${detailsModal.user.id}` ? <Check size={10} /> : <Copy size={10} />}
                        {copiedField === `details-user-id-${detailsModal.user.id}` ? "Kopierad" : "Kopiera"}
                      </span>
                    </button>
                  </div>
                  <p className="mt-1 break-all font-mono text-xs text-slate-200">{detailsModal.user.id}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-slate-900/50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Discord ID</p>
                    {detailsModal.user.discordId ? (
                      <button
                        onClick={() => copyToClipboard(detailsModal.user.discordId!, `details-discord-id-${detailsModal.user.id}`)}
                        className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-slate-300 transition-colors hover:bg-white/10"
                      >
                        <span className="inline-flex items-center gap-1">
                          {copiedField === `details-discord-id-${detailsModal.user.id}` ? <Check size={10} /> : <Copy size={10} />}
                          {copiedField === `details-discord-id-${detailsModal.user.id}` ? "Kopierad" : "Kopiera"}
                        </span>
                      </button>
                    ) : null}
                  </div>
                  <p className="mt-1 break-all font-mono text-xs text-slate-200">{detailsModal.user.discordId ?? "-"}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-slate-900/50 p-3 sm:col-span-2">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">E-post</p>
                  <p className="mt-1 break-all text-xs text-slate-200">{detailsModal.user.email ?? "-"}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-slate-900/50 p-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Skapad</p>
                  <p className="mt-1 text-xs text-slate-200">{formatDate(detailsModal.user.createdAt)}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-slate-900/50 p-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Senast uppdaterad</p>
                  <p className="mt-1 text-xs text-slate-200">{formatDate(detailsModal.user.updatedAt)}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-slate-900/50 p-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Senaste login</p>
                  <p className="mt-1 text-xs text-slate-200">{formatDate(detailsModal.user.lastLogin)}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-slate-900/50 p-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Streak</p>
                  <p className="mt-1 font-mono text-xs text-slate-200">{detailsModal.user.streak}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-slate-900/50 p-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Roll / Tier</p>
                  <p className="mt-1 text-xs text-slate-200">{detailsModal.user.role} / {detailsModal.user.tier}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-slate-900/50 p-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Status</p>
                  <p className="mt-1 text-xs text-slate-200">{detailsModal.user.isBanned ? "Bannad" : "Aktiv"}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-slate-900/50 p-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Affiliate Code</p>
                  <p className="mt-1 break-all font-mono text-xs text-slate-200">{detailsModal.user.affiliateCode ?? "-"}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-slate-900/50 p-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Referred By</p>
                  <p className="mt-1 break-all font-mono text-xs text-slate-200">{detailsModal.user.referredBy ?? "-"}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-slate-900/50 p-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Stripe Customer</p>
                  <p className="mt-1 break-all font-mono text-xs text-slate-200">{detailsModal.user.stripeCustomerId ?? "-"}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-slate-900/50 p-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Stripe Subscription</p>
                  <p className="mt-1 break-all font-mono text-xs text-slate-200">{detailsModal.user.stripeSubscriptionId ?? "-"}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-slate-900/50 p-3 sm:col-span-2">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Discord OAuth scopes</p>
                  <p className="mt-1 break-all text-xs text-slate-200">
                    {formatDiscordScopes(detailsModal.user.accounts[0]?.scope ?? null)}
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-slate-900/50 p-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Discord access token</p>
                  <p className="mt-1 text-xs text-slate-200">
                    {detailsModal.user.accounts[0]?.hasAccessToken ? "Finns" : "Saknas"}
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-slate-900/50 p-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Discord providerAccountId</p>
                  <p className="mt-1 break-all font-mono text-xs text-slate-200">
                    {detailsModal.user.accounts[0]?.providerAccountId ?? "-"}
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-slate-900/50 p-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Discord token expires</p>
                  <p className="mt-1 text-xs text-slate-200">
                    {detailsModal.user.accounts[0]?.expires_at
                      ? formatDate(new Date(detailsModal.user.accounts[0].expires_at * 1000).toISOString())
                      : "-"}
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-white/10 bg-slate-900/50 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300">
                    Aktivitets-tidslinje
                  </h4>
                  <span className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                    Senaste 30 events
                  </span>
                </div>

                <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <div className="rounded-lg border border-white/10 bg-slate-950/70 p-2.5">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Senaste inlägg</p>
                    <p className="mt-1 text-[11px] text-slate-300">{formatDate(activitySummary.lastForumPostAt)}</p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-slate-950/70 p-2.5">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Senaste quest claim</p>
                    <p className="mt-1 text-[11px] text-slate-300">{formatDate(activitySummary.lastQuestClaimAt)}</p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-slate-950/70 p-2.5">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Senaste produktklick</p>
                    <p className="mt-1 text-[11px] text-slate-300">{formatDate(activitySummary.lastProductClickAt)}</p>
                  </div>
                </div>

                {activityLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 size={18} className="animate-spin text-neon-cyan/60" />
                  </div>
                ) : activityError ? (
                  <p className="rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                    {activityError}
                  </p>
                ) : activityTimeline.length === 0 ? (
                  <p className="rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-xs text-slate-400">
                    Ingen aktivitet hittades för användaren än.
                  </p>
                ) : (
                  <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                    {activityTimeline.map((item) => {
                      const Icon = getActivityIcon(item.type);
                      return (
                        <div key={item.id} className="rounded-lg border border-white/10 bg-slate-950/70 p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 items-start gap-2.5">
                              <span className={cn("mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border", getActivityAccent(item.type))}>
                                <Icon size={12} />
                              </span>
                              <div className="min-w-0">
                                <p className="truncate text-xs font-semibold text-white">{item.title}</p>
                                <p className="mt-0.5 text-[11px] text-slate-400">{item.description}</p>
                              </div>
                            </div>
                            <span className="shrink-0 text-[10px] text-slate-500">{formatDate(item.createdAt)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  onClick={() => setDetailsModal(null)}
                  className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300 hover:bg-white/5"
                >
                  Stäng
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
