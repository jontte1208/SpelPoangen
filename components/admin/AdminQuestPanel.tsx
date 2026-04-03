"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  Loader2,
  Zap,
  Target,
  MessageSquare,
  ShoppingBag,
  Gamepad2,
  Users,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type QuestRow = {
  id: string;
  title: string;
  description: string;
  category: "FORUM" | "SHOP" | "STREAK" | "SOCIAL";
  goal: number;
  rewardXP: number;
  rewardCoins: number;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  _count: { userQuests: number };
};

type FormData = {
  title: string;
  description: string;
  category: "FORUM" | "SHOP" | "STREAK" | "SOCIAL";
  goal: number;
  rewardXP: number;
  rewardCoins: number;
  imageUrl: string;
  isActive: boolean;
};

const EMPTY_FORM: FormData = {
  title: "",
  description: "",
  category: "FORUM",
  goal: 1,
  rewardXP: 50,
  rewardCoins: 0,
  imageUrl: "",
  isActive: true,
};

const CATEGORY_LABELS: Record<string, string> = {
  FORUM: "Forum",
  SHOP: "Butik",
  STREAK: "Streak",
  SOCIAL: "Social",
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  FORUM: MessageSquare,
  SHOP: ShoppingBag,
  STREAK: Gamepad2,
  SOCIAL: Users,
};

const CATEGORY_COLORS: Record<string, string> = {
  FORUM: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  SHOP: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  STREAK: "border-orange-500/30 bg-orange-500/10 text-orange-400",
  SOCIAL: "border-purple-500/30 bg-purple-500/10 text-purple-400",
};

export default function AdminQuestPanel() {
  const [quests, setQuests] = useState<QuestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadQuests();
  }, []);

  async function loadQuests() {
    try {
      const res = await fetch("/api/admin/quests");
      if (res.ok) setQuests(await res.json());
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
    setError(null);
  }

  function openEdit(quest: QuestRow) {
    setEditingId(quest.id);
    setForm({
      title: quest.title,
      description: quest.description,
      category: quest.category,
      goal: quest.goal,
      rewardXP: quest.rewardXP,
      rewardCoins: quest.rewardCoins,
      imageUrl: quest.imageUrl ?? "",
      isActive: quest.isActive,
    });
    setShowForm(true);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const url = editingId
        ? `/api/admin/quests/${editingId}`
        : "/api/admin/quests";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(typeof data.error === "string" ? data.error : "Validering misslyckades");
        return;
      }

      setShowForm(false);
      setEditingId(null);
      await loadQuests();
    } catch {
      setError("Nätverksfel");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Är du säker på att du vill ta bort denna quest?")) return;

    try {
      const res = await fetch(`/api/admin/quests/${id}`, { method: "DELETE" });
      if (res.ok) {
        setQuests((prev) => prev.filter((q) => q.id !== id));
      }
    } catch {
      /* ignore */
    }
  }

  async function handleToggleActive(quest: QuestRow) {
    try {
      const res = await fetch(`/api/admin/quests/${quest.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !quest.isActive }),
      });
      if (res.ok) {
        setQuests((prev) =>
          prev.map((q) =>
            q.id === quest.id ? { ...q, isActive: !q.isActive } : q
          )
        );
      }
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-orange-400/70 mb-1">
            Quest Management
          </p>
          <h2 className="text-xl font-bold text-white">Hantera Utmaningar</h2>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-xl border border-orange-500/40 bg-orange-500/15 px-4 py-2.5 text-sm font-semibold text-orange-400 transition-colors hover:bg-orange-500/25"
        >
          <Plus size={16} /> Ny Quest
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="rounded-2xl border border-orange-500/20 bg-slate-900/80 p-6 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">
              {editingId ? "Redigera Quest" : "Skapa Quest"}
            </h3>
            <button
              onClick={() => setShowForm(false)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            {/* Title */}
            <div className="sm:col-span-2">
              <label className="mb-1 block text-[11px] uppercase tracking-widest text-slate-500">
                Titel
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                maxLength={100}
                className="w-full rounded-xl border border-white/10 bg-slate-800/60 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-orange-500/50"
                placeholder="t.ex. Forum-krigaren"
              />
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className="mb-1 block text-[11px] uppercase tracking-widest text-slate-500">
                Beskrivning
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
                maxLength={500}
                rows={2}
                className="w-full rounded-xl border border-white/10 bg-slate-800/60 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-orange-500/50 resize-none"
                placeholder="Vad ska spelaren göra?"
              />
            </div>

            {/* Category */}
            <div>
              <label className="mb-1 block text-[11px] uppercase tracking-widest text-slate-500">
                Kategori
              </label>
              <select
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value as FormData["category"] })
                }
                className="w-full rounded-xl border border-white/10 bg-slate-800/60 px-4 py-2.5 text-sm text-white outline-none focus:border-orange-500/50"
              >
                <option value="FORUM">Forum</option>
                <option value="SHOP">Butik</option>
                <option value="STREAK">Streak</option>
                <option value="SOCIAL">Social</option>
              </select>
            </div>

            {/* Goal */}
            <div>
              <label className="mb-1 block text-[11px] uppercase tracking-widest text-slate-500">
                Mål-värde
              </label>
              <input
                type="number"
                value={form.goal}
                onChange={(e) => setForm({ ...form, goal: Number(e.target.value) })}
                required
                min={1}
                max={1000}
                className="w-full rounded-xl border border-white/10 bg-slate-800/60 px-4 py-2.5 text-sm text-white outline-none focus:border-orange-500/50"
              />
            </div>

            {/* XP */}
            <div>
              <label className="mb-1 block text-[11px] uppercase tracking-widest text-slate-500">
                XP-belöning
              </label>
              <input
                type="number"
                value={form.rewardXP}
                onChange={(e) => setForm({ ...form, rewardXP: Number(e.target.value) })}
                required
                min={0}
                max={10000}
                className="w-full rounded-xl border border-white/10 bg-slate-800/60 px-4 py-2.5 text-sm text-white outline-none focus:border-orange-500/50"
              />
            </div>

            {/* Coins */}
            <div>
              <label className="mb-1 block text-[11px] uppercase tracking-widest text-slate-500">
                Coin-belöning
              </label>
              <input
                type="number"
                value={form.rewardCoins}
                onChange={(e) => setForm({ ...form, rewardCoins: Number(e.target.value) })}
                min={0}
                max={10000}
                className="w-full rounded-xl border border-white/10 bg-slate-800/60 px-4 py-2.5 text-sm text-white outline-none focus:border-orange-500/50"
              />
            </div>

            {/* Image URL */}
            <div className="sm:col-span-2">
              <label className="mb-1 block text-[11px] uppercase tracking-widest text-slate-500">
                Bild-URL (valfritt)
              </label>
              <input
                type="url"
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-slate-800/60 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-orange-500/50"
                placeholder="https://images.unsplash.com/..."
              />
            </div>

            {/* Active toggle */}
            <div className="flex items-center gap-3 sm:col-span-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, isActive: !form.isActive })}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
                  form.isActive
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    : "border-red-500/30 bg-red-500/10 text-red-400"
                )}
              >
                {form.isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                {form.isActive ? "Aktiv" : "Inaktiv"}
              </button>
            </div>

            {error && (
              <p className="text-sm text-red-400 sm:col-span-2">{error}</p>
            )}

            {/* Submit */}
            <div className="flex gap-3 sm:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-xl border border-orange-500/40 bg-orange-500/15 px-5 py-2.5 text-sm font-semibold text-orange-400 transition-colors hover:bg-orange-500/25 disabled:opacity-60"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {editingId ? "Spara ändringar" : "Skapa Quest"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-xl border border-white/10 px-5 py-2.5 text-sm text-slate-400 hover:text-white"
              >
                Avbryt
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Quest table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-slate-500" />
        </div>
      ) : quests.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-slate-900/40 py-12 text-center">
          <p className="text-slate-500">Inga quests skapade ännu.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {quests.map((quest) => {
            const CatIcon = CATEGORY_ICONS[quest.category] ?? Zap;
            return (
              <div
                key={quest.id}
                className={cn(
                  "flex flex-col gap-3 rounded-2xl border p-4 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between",
                  quest.isActive
                    ? "border-white/8 bg-slate-900/60"
                    : "border-white/5 bg-slate-900/30 opacity-60"
                )}
              >
                <div className="flex items-center gap-4 min-w-0">
                  {quest.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={quest.imageUrl}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-slate-800">
                      <CatIcon size={18} className="text-slate-400" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-white truncate">{quest.title}</h4>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                          CATEGORY_COLORS[quest.category]
                        )}
                      >
                        <CatIcon size={10} />
                        {CATEGORY_LABELS[quest.category]}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate">{quest.description}</p>
                    <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Target size={10} /> Mål: {quest.goal}
                      </span>
                      <span className="flex items-center gap-1">
                        <Zap size={10} /> {quest.rewardXP} XP
                      </span>
                      <span>{quest._count.userQuests} spelare</span>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(quest)}
                    className={cn(
                      "rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors",
                      quest.isActive
                        ? "text-emerald-400 hover:bg-emerald-500/10"
                        : "text-red-400 hover:bg-red-500/10"
                    )}
                    title={quest.isActive ? "Inaktivera" : "Aktivera"}
                  >
                    {quest.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                  </button>
                  <button
                    onClick={() => openEdit(quest)}
                    className="flex items-center gap-1.5 rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-1.5 text-xs font-semibold text-orange-400 transition-colors hover:bg-orange-500/20"
                  >
                    <Pencil size={12} /> Redigera
                  </button>
                  <button
                    onClick={() => handleDelete(quest.id)}
                    className="rounded-lg border border-red-500/20 p-1.5 text-red-400/60 transition-colors hover:bg-red-500/10 hover:text-red-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
