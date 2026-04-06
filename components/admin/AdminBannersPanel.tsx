"use client";

import { useEffect, useState } from "react";
import {
  Plus, Pencil, Trash2, X, Loader2, Lock, Unlock,
  ToggleLeft, ToggleRight, Search, UserCheck, Palette,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Banner = {
  id: string;
  key: string;
  label: string;
  style: string | null;
  imageUrl: string | null;
  coinCost: number;
  isPremiumOnly: boolean;
  isActive: boolean;
  sortOrder: number;
};

type AdminUser = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
};

type BannerForm = {
  key: string;
  label: string;
  style: string;
  imageUrl: string;
  coinCost: number;
  isPremiumOnly: boolean;
  isActive: boolean;
  sortOrder: number;
};

const EMPTY_FORM: BannerForm = {
  key: "",
  label: "",
  style: "",
  imageUrl: "",
  coinCost: 0,
  isPremiumOnly: false,
  isActive: true,
  sortOrder: 0,
};

function slugify(str: string) {
  return str.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_-]/g, "");
}

function BannerPreview({ banner }: { banner: Pick<Banner, "style" | "imageUrl"> }) {
  const bg = banner.imageUrl
    ? `url(${banner.imageUrl}) center/cover no-repeat`
    : banner.style ?? "#0d1f3c";
  return <div className="h-10 w-full rounded-lg" style={{ background: bg }} />;
}

export default function AdminBannersPanel() {
  const [tab, setTab] = useState<"manage" | "unlock">("manage");
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BannerForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Unlock tab state
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [userUnlocked, setUserUnlocked] = useState<string[]>([]);
  const [loadingUser, setLoadingUser] = useState(false);
  const [unlocking, setUnlocking] = useState<string | null>(null);

  useEffect(() => {
    loadBanners();
  }, []);

  useEffect(() => {
    if (tab === "unlock" && users.length === 0) {
      fetch("/api/admin/users")
        .then((r) => r.json())
        .then((data) => { if (Array.isArray(data)) setUsers(data); })
        .catch(() => {});
    }
  }, [tab, users.length]);

  async function loadBanners() {
    setLoading(true);
    const res = await fetch("/api/admin/banners");
    if (res.ok) setBanners(await res.json());
    setLoading(false);
  }

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
    setError(null);
  }

  function openEdit(b: Banner) {
    setEditingId(b.id);
    setForm({
      key: b.key,
      label: b.label,
      style: b.style ?? "",
      imageUrl: b.imageUrl ?? "",
      coinCost: b.coinCost,
      isPremiumOnly: b.isPremiumOnly,
      isActive: b.isActive,
      sortOrder: b.sortOrder,
    });
    setShowForm(true);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const url = editingId ? `/api/admin/banners/${editingId}` : "/api/admin/banners";
      const method = editingId ? "PUT" : "POST";
      const payload = {
        ...form,
        style: form.style || null,
        imageUrl: form.imageUrl || null,
      };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(typeof data.error === "string" ? data.error : "Misslyckades");
        return;
      }
      setShowForm(false);
      await loadBanners();
    } catch {
      setError("Nätverksfel");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Ta bort bannern?")) return;
    await fetch(`/api/admin/banners/${id}`, { method: "DELETE" });
    setBanners((prev) => prev.filter((b) => b.id !== id));
  }

  async function handleToggleActive(b: Banner) {
    const res = await fetch(`/api/admin/banners/${b.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !b.isActive }),
    });
    if (res.ok) setBanners((prev) => prev.map((x) => x.id === b.id ? { ...x, isActive: !x.isActive } : x));
  }

  async function selectUser(user: AdminUser) {
    setSelectedUser(user);
    setLoadingUser(true);
    const res = await fetch(`/api/admin/unlock-item?userId=${user.id}`);
    if (res.ok) {
      const data = await res.json();
      setUserUnlocked(data.unlockedBannerKeys ?? []);
    }
    setLoadingUser(false);
  }

  async function unlockBanner(bannerKey: string) {
    if (!selectedUser) return;
    setUnlocking(bannerKey);
    const res = await fetch("/api/admin/unlock-item", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: selectedUser.id, bannerKey }),
    });
    if (res.ok) {
      setUserUnlocked((prev) => [...prev, bannerKey]);
    }
    setUnlocking(null);
  }

  const filteredUsers = userSearch.trim()
    ? users.filter(
        (u) =>
          u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
          u.email?.toLowerCase().includes(userSearch.toLowerCase())
      )
    : users;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-neon-cyan/70">Banners</p>
          <h2 className="text-xl font-bold text-white">Banner-hantering</h2>
        </div>
        {tab === "manage" && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-2.5 text-sm font-semibold text-emerald-400 hover:bg-emerald-500/25"
          >
            <Plus size={16} /> Ny Banner
          </button>
        )}
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1.5 rounded-xl border border-white/5 bg-slate-900/50 p-1">
        {(["manage", "unlock"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all",
              tab === t
                ? "bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30"
                : "text-slate-400 hover:text-white border border-transparent"
            )}
          >
            {t === "manage" ? <><Palette size={13} /> Hantera banners</> : <><UserCheck size={13} /> Lås upp för användare</>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={22} className="animate-spin text-neon-cyan/50" />
        </div>
      ) : (
        <>
          {/* MANAGE TAB */}
          {tab === "manage" && (
            <div className="space-y-4">
              {showForm && (
                <div className="rounded-2xl border border-neon-cyan/20 bg-slate-900/80 p-6 backdrop-blur-xl">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white">
                      {editingId ? "Redigera" : "Skapa"} Banner
                    </h3>
                    <button
                      onClick={() => setShowForm(false)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-[11px] uppercase tracking-widest text-slate-500">
                        Namn (label)
                      </label>
                      <input
                        type="text"
                        value={form.label}
                        onChange={(e) => {
                          const label = e.target.value;
                          setForm((f) => ({
                            ...f,
                            label,
                            key: editingId ? f.key : slugify(label),
                          }));
                        }}
                        required
                        placeholder="Dragon Fire"
                        className="w-full rounded-xl border border-white/10 bg-slate-800/60 px-4 py-2.5 text-sm text-white outline-none focus:border-neon-cyan/50"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] uppercase tracking-widest text-slate-500">
                        Nyckel (key) — unik slug
                      </label>
                      <input
                        type="text"
                        value={form.key}
                        onChange={(e) => setForm({ ...form, key: e.target.value })}
                        required
                        placeholder="dragon_fire"
                        className="w-full rounded-xl border border-white/10 bg-slate-800/60 px-4 py-2.5 text-sm text-white outline-none focus:border-neon-cyan/50"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-[11px] uppercase tracking-widest text-slate-500">
                        CSS Gradient (style)
                      </label>
                      <input
                        type="text"
                        value={form.style}
                        onChange={(e) => setForm({ ...form, style: e.target.value })}
                        placeholder="linear-gradient(135deg,#000 0%,#fff 100%)"
                        className="w-full rounded-xl border border-white/10 bg-slate-800/60 px-4 py-2.5 text-sm text-white outline-none focus:border-neon-cyan/50"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-[11px] uppercase tracking-widest text-slate-500">
                        Bild-URL (imageUrl) — används istället för gradient om angiven
                      </label>
                      <input
                        type="url"
                        value={form.imageUrl}
                        onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                        placeholder="https://..."
                        className="w-full rounded-xl border border-white/10 bg-slate-800/60 px-4 py-2.5 text-sm text-white outline-none focus:border-neon-cyan/50"
                      />
                    </div>
                    {(form.style || form.imageUrl) && (
                      <div className="sm:col-span-2">
                        <p className="mb-1 text-[10px] uppercase tracking-widest text-slate-500">Förhandsgranskning</p>
                        <BannerPreview banner={{ style: form.style || null, imageUrl: form.imageUrl || null }} />
                      </div>
                    )}
                    <div>
                      <label className="mb-1 block text-[11px] uppercase tracking-widest text-slate-500">
                        Pris i Coins
                      </label>
                      <input
                        type="number"
                        value={form.coinCost}
                        onChange={(e) => setForm({ ...form, coinCost: Number(e.target.value) })}
                        min={0}
                        className="w-full rounded-xl border border-white/10 bg-slate-800/60 px-4 py-2.5 text-sm text-white outline-none focus:border-neon-cyan/50"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] uppercase tracking-widest text-slate-500">
                        Sorteringsordning
                      </label>
                      <input
                        type="number"
                        value={form.sortOrder}
                        onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                        className="w-full rounded-xl border border-white/10 bg-slate-800/60 px-4 py-2.5 text-sm text-white outline-none focus:border-neon-cyan/50"
                      />
                    </div>
                    <div className="flex items-center gap-6 sm:col-span-2">
                      <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
                        <input
                          type="checkbox"
                          checked={form.isPremiumOnly}
                          onChange={(e) => setForm({ ...form, isPremiumOnly: e.target.checked })}
                          className="sr-only"
                        />
                        {form.isPremiumOnly ? (
                          <ToggleRight size={22} className="text-violet-400" />
                        ) : (
                          <ToggleLeft size={22} className="text-slate-500" />
                        )}
                        Endast premium (kräver upplåsning)
                      </label>
                      <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
                        <input
                          type="checkbox"
                          checked={form.isActive}
                          onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                          className="sr-only"
                        />
                        {form.isActive ? (
                          <ToggleRight size={22} className="text-emerald-400" />
                        ) : (
                          <ToggleLeft size={22} className="text-slate-500" />
                        )}
                        Aktiv
                      </label>
                    </div>
                    {error && (
                      <p className="rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs text-red-400 sm:col-span-2">
                        {error}
                      </p>
                    )}
                    <div className="flex gap-2 sm:col-span-2">
                      <button
                        type="button"
                        onClick={() => setShowForm(false)}
                        className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-slate-400 hover:bg-white/5"
                      >
                        Avbryt
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/15 py-2.5 text-sm font-semibold text-emerald-400 hover:bg-emerald-500/25 disabled:opacity-50"
                      >
                        {saving && <Loader2 size={14} className="animate-spin" />}
                        {editingId ? "Uppdatera" : "Skapa"}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {banners.length === 0 ? (
                <p className="rounded-2xl border border-white/5 bg-slate-900/40 py-12 text-center text-sm text-slate-500">
                  Inga banners ännu.
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {banners.map((b) => (
                    <div
                      key={b.id}
                      className={cn(
                        "rounded-xl border border-white/5 bg-slate-900/50 overflow-hidden",
                        !b.isActive && "opacity-50"
                      )}
                    >
                      <BannerPreview banner={b} />
                      <div className="p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-white text-sm">{b.label}</p>
                            <p className="font-mono text-[10px] text-slate-500">{b.key}</p>
                          </div>
                          <div className="flex shrink-0 items-center gap-1">
                            {b.isPremiumOnly && (
                              <span className="rounded-full border border-violet-400/30 bg-violet-400/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-violet-400">
                                Premium
                              </span>
                            )}
                            {b.coinCost > 0 && (
                              <span className="text-[10px] text-amber-300">{b.coinCost.toLocaleString("sv-SE")}c</span>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 flex items-center gap-1">
                          <button
                            onClick={() => handleToggleActive(b)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white"
                            title={b.isActive ? "Inaktivera" : "Aktivera"}
                          >
                            {b.isActive ? (
                              <ToggleRight size={16} className="text-emerald-400" />
                            ) : (
                              <ToggleLeft size={16} className="text-slate-500" />
                            )}
                          </button>
                          <button
                            onClick={() => openEdit(b)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(b.id)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-500/10 hover:text-red-400"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* UNLOCK TAB */}
          {tab === "unlock" && (
            <div className="grid gap-6 lg:grid-cols-2">
              {/* User search */}
              <div className="space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Sök användare
                </p>
                <div className="relative">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Namn eller email..."
                    className="w-full rounded-xl border border-white/10 bg-slate-800/60 py-2.5 pl-9 pr-4 text-sm text-white outline-none focus:border-neon-cyan/50"
                  />
                </div>
                <div className="max-h-80 space-y-1.5 overflow-y-auto pr-1">
                  {filteredUsers.slice(0, 30).map((u) => (
                    <button
                      key={u.id}
                      onClick={() => selectUser(u)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all",
                        selectedUser?.id === u.id
                          ? "border-neon-cyan/30 bg-neon-cyan/10 text-white"
                          : "border-white/5 bg-slate-900/50 text-slate-300 hover:border-white/10 hover:bg-white/5"
                      )}
                    >
                      {u.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={u.image} alt="" className="h-8 w-8 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neon-cyan/10 text-xs font-bold text-neon-cyan">
                          {(u.name ?? "?")[0]?.toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{u.name ?? "Okänd"}</p>
                        <p className="truncate text-[11px] text-slate-500">{u.email}</p>
                      </div>
                    </button>
                  ))}
                  {filteredUsers.length === 0 && (
                    <p className="py-6 text-center text-sm text-slate-500">Inga träffar</p>
                  )}
                </div>
              </div>

              {/* Banner unlock grid */}
              <div>
                {!selectedUser ? (
                  <div className="flex h-full items-center justify-center rounded-2xl border border-white/5 bg-slate-900/40 py-12 text-sm text-slate-500">
                    Välj en användare till vänster
                  </div>
                ) : loadingUser ? (
                  <div className="flex h-full items-center justify-center py-12">
                    <Loader2 size={22} className="animate-spin text-neon-cyan/50" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                      Banners för <span className="text-white">{selectedUser.name}</span>
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {banners.filter((b) => b.isActive).map((b) => {
                        const isUnlocked = userUnlocked.includes(b.key);
                        return (
                          <div
                            key={b.key}
                            className="overflow-hidden rounded-xl border border-white/5 bg-slate-900/50"
                          >
                            <BannerPreview banner={b} />
                            <div className="flex items-center justify-between gap-2 px-2 py-1.5">
                              <div className="min-w-0">
                                <p className="truncate text-xs font-semibold text-white">{b.label}</p>
                                {b.isPremiumOnly && (
                                  <p className="text-[9px] uppercase tracking-wider text-violet-400">Premium</p>
                                )}
                              </div>
                              {isUnlocked ? (
                                <span className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                                  <Unlock size={9} /> Upplåst
                                </span>
                              ) : (
                                <button
                                  onClick={() => unlockBanner(b.key)}
                                  disabled={unlocking === b.key}
                                  className="flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400 hover:bg-amber-500/20 disabled:opacity-50"
                                >
                                  {unlocking === b.key ? (
                                    <Loader2 size={9} className="animate-spin" />
                                  ) : (
                                    <Lock size={9} />
                                  )}
                                  Lås upp
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
