"use client";

import { useEffect, useRef, useState } from "react";
import {
  Plus, Pencil, Trash2, X, Loader2, Package, Coins,
  CheckCircle, XCircle, ToggleLeft, ToggleRight, TrendingUp, ShoppingBag, ImagePlus
} from "lucide-react";
import { cn } from "@/lib/utils";

type ShopItem = {
  id: string;
  name: string;
  description: string;
  coinCost: number;
  stock: number;
  category: "DIGITAL" | "PHYSICAL";
  discordRoleId: string | null;
  imageUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  _count: { orders: number };
};

type Order = {
  id: string;
  coinsSpent: number;
  status: string;
  createdAt: string;
  fulfilledAt: string | null;
  redemptionCode: string | null;
  adminNote: string | null;
  shopItem: { name: string; category: string };
  user: { name: string | null; discordId: string | null };
};

type RoiData = {
  coinsInCirculation: number;
  coinsSpentInShop: number;
  estimatedLiabilitySeK: number;
  estimatedShopCostSek: number;
  stripeRevenueSek: number;
  totalOrders: number;
  pendingOrders: number;
  fulfilledOrders: number;
};

type ItemForm = {
  name: string;
  description: string;
  coinCost: number;
  stock: number;
  category: "DIGITAL" | "PHYSICAL";
  discordRoleId: string;
  imageUrl: string;
  isActive: boolean;
  sortOrder: number;
};

const EMPTY_FORM: ItemForm = {
  name: "",
  description: "",
  coinCost: 1000,
  stock: -1,
  category: "DIGITAL",
  discordRoleId: "",
  imageUrl: "",
  isActive: true,
  sortOrder: 0,
};

const STATUS_STYLE: Record<string, string> = {
  PENDING: "text-amber-400 border-amber-400/30 bg-amber-500/10",
  CONFIRMED: "text-neon-cyan border-neon-cyan/30 bg-neon-cyan/10",
  FULFILLED: "text-emerald-400 border-emerald-400/30 bg-emerald-500/10",
  CANCELLED: "text-red-400 border-red-400/30 bg-red-500/10",
};

export default function AdminLootShopPanel() {
  const [tab, setTab] = useState<"items" | "orders" | "roi">("items");
  const [items, setItems] = useState<ShopItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [roi, setRoi] = useState<RoiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ItemForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fulfillOrder, setFulfillOrder] = useState<Order | null>(null);
  const [fulfillCode, setFulfillCode] = useState("");
  const [fulfillNote, setFulfillNote] = useState("");
  const [fulfilling, setFulfilling] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [itemsRes, ordersRes, roiRes] = await Promise.all([
        fetch("/api/admin/loot-shop/items"),
        fetch("/api/admin/loot-shop/orders"),
        fetch("/api/admin/loot-shop/roi"),
      ]);
      if (itemsRes.ok) setItems(await itemsRes.json());
      if (ordersRes.ok) setOrders(await ordersRes.json());
      if (roiRes.ok) setRoi(await roiRes.json());
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
    setError(null);
  }

  function openEdit(item: ShopItem) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      description: item.description,
      coinCost: item.coinCost,
      stock: item.stock,
      category: item.category,
      discordRoleId: item.discordRoleId ?? "",
      imageUrl: item.imageUrl ?? "",
      isActive: item.isActive,
      sortOrder: item.sortOrder,
    });
    setShowForm(true);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const url = editingId ? `/api/admin/loot-shop/items/${editingId}` : "/api/admin/loot-shop/items";
      const method = editingId ? "PUT" : "POST";
      const payload = {
        ...form,
        imageUrl: form.imageUrl || null,
        discordRoleId: form.discordRoleId || null,
      };
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) {
        const data = await res.json();
        setError(typeof data.error === "string" ? data.error : "Misslyckades");
        return;
      }
      setShowForm(false);
      await loadAll();
    } catch { setError("Nätverksfel"); } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Ta bort artikeln?")) return;
    await fetch(`/api/admin/loot-shop/items/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  async function handleToggleActive(item: ShopItem) {
    const res = await fetch(`/api/admin/loot-shop/items/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !item.isActive }),
    });
    if (res.ok) setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, isActive: !i.isActive } : i));
  }

  async function handleImageUpload(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/loot-shop/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) {
        setForm((f) => ({ ...f, imageUrl: data.url }));
      } else {
        setError(data.error ?? "Uppladdning misslyckades");
      }
    } catch {
      setError("Nätverksfel vid uppladdning");
    } finally {
      setUploading(false);
    }
  }

  async function handleFulfill() {
    if (!fulfillOrder) return;
    setFulfilling(true);
    const res = await fetch(`/api/admin/loot-shop/orders/${fulfillOrder.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "FULFILLED", redemptionCode: fulfillCode || null, adminNote: fulfillNote || null }),
    });
    if (res.ok) {
      setOrders((prev) => prev.map((o) => o.id === fulfillOrder.id ? { ...o, status: "FULFILLED", redemptionCode: fulfillCode || null } : o));
      setFulfillOrder(null);
      setFulfillCode("");
      setFulfillNote("");
    }
    setFulfilling(false);
  }

  async function handleCancel(order: Order) {
    if (!confirm("Avbryt ordern och återbetala coins?")) return;
    const res = await fetch(`/api/admin/loot-shop/orders/${order.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CANCELLED" }),
    });
    if (res.ok) setOrders((prev) => prev.map((o) => o.id === order.id ? { ...o, status: "CANCELLED" } : o));
  }

  const pendingOrders = orders.filter((o) => o.status === "PENDING");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-neon-cyan/70">Loot Shop</p>
          <h2 className="text-xl font-bold text-white">Coin Shop-hantering</h2>
        </div>
        {tab === "items" && (
          <button onClick={openCreate} className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-2.5 text-sm font-semibold text-emerald-400 hover:bg-emerald-500/25">
            <Plus size={16} /> Ny Artikel
          </button>
        )}
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1.5 rounded-xl border border-white/5 bg-slate-900/50 p-1">
        {(["items", "orders", "roi"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all",
            tab === t ? "bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30" : "text-slate-400 hover:text-white border border-transparent"
          )}>
            {t === "items" && <><Package size={13} /> Artiklar</>}
            {t === "orders" && <><ShoppingBag size={13} /> Orders {pendingOrders.length > 0 && <span className="ml-1 rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-black">{pendingOrders.length}</span>}</>}
            {t === "roi" && <><TrendingUp size={13} /> ROI</>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={22} className="animate-spin text-neon-cyan/50" /></div>
      ) : (
        <>
          {/* ITEMS TAB */}
          {tab === "items" && (
            <div className="space-y-4">
              {showForm && (
                <div className="rounded-2xl border border-neon-cyan/20 bg-slate-900/80 p-6 backdrop-blur-xl">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white">{editingId ? "Redigera" : "Skapa"} Artikel</h3>
                    <button onClick={() => setShowForm(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white"><X size={18} /></button>
                  </div>
                  <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-[11px] uppercase tracking-widest text-slate-500">Namn</label>
                      <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full rounded-xl border border-white/10 bg-slate-800/60 px-4 py-2.5 text-sm text-white outline-none focus:border-neon-cyan/50" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-[11px] uppercase tracking-widest text-slate-500">Beskrivning</label>
                      <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required rows={3} className="w-full resize-none rounded-xl border border-white/10 bg-slate-800/60 px-4 py-2.5 text-sm text-white outline-none focus:border-neon-cyan/50" />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] uppercase tracking-widest text-slate-500">Coin-kostnad</label>
                      <input type="number" value={form.coinCost} onChange={(e) => setForm({ ...form, coinCost: Number(e.target.value) })} min={0} required className="w-full rounded-xl border border-white/10 bg-slate-800/60 px-4 py-2.5 text-sm text-white outline-none focus:border-neon-cyan/50" />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] uppercase tracking-widest text-slate-500">Lager (-1 = obegränsat)</label>
                      <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} min={-1} required className="w-full rounded-xl border border-white/10 bg-slate-800/60 px-4 py-2.5 text-sm text-white outline-none focus:border-neon-cyan/50" />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] uppercase tracking-widest text-slate-500">Kategori</label>
                      <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as "DIGITAL" | "PHYSICAL" })} className="w-full rounded-xl border border-white/10 bg-slate-800/60 px-4 py-2.5 text-sm text-white outline-none focus:border-neon-cyan/50">
                        <option value="DIGITAL">Digital</option>
                        <option value="PHYSICAL">Fysisk</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] uppercase tracking-widest text-slate-500">Sorteringsordning</label>
                      <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} className="w-full rounded-xl border border-white/10 bg-slate-800/60 px-4 py-2.5 text-sm text-white outline-none focus:border-neon-cyan/50" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-[11px] uppercase tracking-widest text-slate-500">Bild</label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={form.imageUrl}
                          onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                          className="flex-1 rounded-xl border border-white/10 bg-slate-800/60 px-4 py-2.5 text-sm text-white outline-none focus:border-neon-cyan/50"
                          placeholder="https://... eller ladda upp nedan"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                          className="flex items-center gap-2 rounded-xl border border-neon-cyan/30 bg-neon-cyan/10 px-4 py-2.5 text-sm font-semibold text-neon-cyan hover:bg-neon-cyan/20 disabled:opacity-50"
                        >
                          {uploading ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}
                          {uploading ? "Laddar..." : "Ladda upp"}
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(file);
                            e.target.value = "";
                          }}
                        />
                      </div>
                      {form.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={form.imageUrl} alt="Förhandsgranskning" className="mt-2 h-24 w-24 rounded-xl border border-white/10 object-contain bg-slate-950 p-1" />
                      )}
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-[11px] uppercase tracking-widest text-slate-500">Discord Roll-ID (valfri, tilldelas automatiskt)</label>
                      <input type="text" value={form.discordRoleId} onChange={(e) => setForm({ ...form, discordRoleId: e.target.value })} className="w-full rounded-xl border border-white/10 bg-slate-800/60 px-4 py-2.5 text-sm text-white outline-none focus:border-neon-cyan/50" placeholder="123456789012345678" />
                    </div>
                    <div className="flex items-center gap-3 sm:col-span-2">
                      <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
                        <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="sr-only" />
                        {form.isActive ? <ToggleRight size={22} className="text-emerald-400" /> : <ToggleLeft size={22} className="text-slate-500" />}
                        Aktiv
                      </label>
                    </div>
                    {error && <p className="rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs text-red-400 sm:col-span-2">{error}</p>}
                    <div className="flex gap-2 sm:col-span-2">
                      <button type="button" onClick={() => setShowForm(false)} className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-slate-400 hover:bg-white/5">Avbryt</button>
                      <button type="submit" disabled={saving} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/15 py-2.5 text-sm font-semibold text-emerald-400 hover:bg-emerald-500/25 disabled:opacity-50">
                        {saving && <Loader2 size={14} className="animate-spin" />}
                        {editingId ? "Uppdatera" : "Skapa"}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {items.length === 0 ? (
                <p className="rounded-2xl border border-white/5 bg-slate-900/40 py-12 text-center text-sm text-slate-500">Inga artiklar ännu.</p>
              ) : (
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.id} className={cn("rounded-xl border border-white/5 bg-slate-900/50 p-4", !item.isActive && "opacity-50")}>
                      <div className="flex items-center gap-4">
                        {item.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.imageUrl} alt={item.name} className="h-12 w-12 rounded-lg border border-white/10 object-contain bg-slate-950 p-1" />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-white/10 bg-slate-800"><Package size={18} className="text-slate-500" /></div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="truncate font-semibold text-white">{item.name}</h4>
                            <span className={cn("rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider", item.category === "DIGITAL" ? "border-neon-cyan/30 text-neon-cyan" : "border-amber-400/30 text-amber-400")}>
                              {item.category === "DIGITAL" ? "Digital" : "Fysisk"}
                            </span>
                          </div>
                          <div className="mt-1 flex flex-wrap gap-3 text-[11px]">
                            <span className="flex items-center gap-1 text-neon-cyan"><Coins size={10} /> {item.coinCost.toLocaleString("sv-SE")}</span>
                            <span className="text-slate-500">{item.stock === -1 ? "Obegränsat" : `${item.stock} kvar`}</span>
                            <span className="text-slate-500">{item._count.orders} orders</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => handleToggleActive(item)} className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white" title={item.isActive ? "Inaktivera" : "Aktivera"}>
                            {item.isActive ? <ToggleRight size={18} className="text-emerald-400" /> : <ToggleLeft size={18} className="text-slate-500" />}
                          </button>
                          <button onClick={() => openEdit(item)} className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"><Pencil size={15} /></button>
                          <button onClick={() => handleDelete(item.id)} className="rounded-lg p-2 text-slate-400 hover:bg-red-500/10 hover:text-red-400"><Trash2 size={15} /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ORDERS TAB */}
          {tab === "orders" && (
            <div className="space-y-2">
              {orders.length === 0 ? (
                <p className="rounded-2xl border border-white/5 bg-slate-900/40 py-12 text-center text-sm text-slate-500">Inga orders ännu.</p>
              ) : (
                orders.map((order) => (
                  <div key={order.id} className="rounded-xl border border-white/5 bg-slate-900/50 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{order.shopItem.name}</span>
                          <span className={cn("rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider", STATUS_STYLE[order.status])}>
                            {order.status}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {order.user.name ?? "Okänd"} {order.user.discordId ? `· <@${order.user.discordId}>` : ""}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          {new Date(order.createdAt).toLocaleDateString("sv-SE")} · {order.coinsSpent.toLocaleString("sv-SE")} coins
                        </p>
                        {order.redemptionCode && (
                          <p className="mt-1 font-mono text-xs text-emerald-400">Kod: {order.redemptionCode}</p>
                        )}
                      </div>
                      {order.status === "PENDING" && (
                        <div className="flex shrink-0 gap-1.5">
                          <button onClick={() => { setFulfillOrder(order); setFulfillCode(""); setFulfillNote(""); }} className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20">
                            <CheckCircle size={12} /> Leverera
                          </button>
                          <button onClick={() => handleCancel(order)} className="flex items-center gap-1.5 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20">
                            <XCircle size={12} /> Avbryt
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ROI TAB */}
          {tab === "roi" && roi && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: "Coins i cirkulation", value: roi.coinsInCirculation.toLocaleString("sv-SE"), sub: `≈ ${roi.estimatedLiabilitySeK.toFixed(0)} kr skuld`, color: "text-amber-400" },
                  { label: "Coins inlösta i shop", value: roi.coinsSpentInShop.toLocaleString("sv-SE"), sub: `≈ ${roi.estimatedShopCostSek.toFixed(0)} kr kostnad`, color: "text-red-400" },
                  { label: "Stripe-intäkter", value: `${roi.stripeRevenueSek.toFixed(0)} kr`, sub: `ROI: ${roi.stripeRevenueSek > 0 ? ((roi.stripeRevenueSek / Math.max(roi.estimatedShopCostSek, 1)) * 100).toFixed(0) : "—"}%`, color: "text-emerald-400" },
                  { label: "Orders totalt", value: roi.totalOrders.toString(), sub: `${roi.pendingOrders} väntar · ${roi.fulfilledOrders} levererade`, color: "text-neon-cyan" },
                ].map((card) => (
                  <div key={card.label} className="rounded-2xl border border-white/5 bg-slate-900/60 p-5">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">{card.label}</p>
                    <p className={cn("mt-1.5 font-display text-2xl font-semibold", card.color)}>{card.value}</p>
                    <p className="mt-1 text-[11px] text-slate-500">{card.sub}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-5 text-sm text-slate-400">
                <p className="font-semibold text-white mb-2">Ekonomisk förklaring</p>
                <p>100 Coins = 1 kr i kostnadsbasis för dig som ägare. Digitala artiklar (Discord-roller, badges) kostar 0 kr att producera och är 100% vinst. Fysiska artiklar (presentkort) har en reell kostnad.</p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Fulfill modal */}
      {fulfillOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#010f1e] p-6 shadow-2xl">
            <h3 className="font-semibold text-white">Leverera order</h3>
            <p className="mt-1 text-sm text-slate-400">{fulfillOrder.shopItem.name} · {fulfillOrder.user.name}</p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-[11px] uppercase tracking-widest text-slate-500">Inlösningskod (valfri)</label>
                <input type="text" value={fulfillCode} onChange={(e) => setFulfillCode(e.target.value)} className="w-full rounded-xl border border-white/10 bg-slate-800/60 px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-400/50" placeholder="STEAM-XXXX-XXXX-XXXX" />
              </div>
              <div>
                <label className="mb-1 block text-[11px] uppercase tracking-widest text-slate-500">Admin-anteckning (valfri)</label>
                <input type="text" value={fulfillNote} onChange={(e) => setFulfillNote(e.target.value)} className="w-full rounded-xl border border-white/10 bg-slate-800/60 px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-400/50" />
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              <button onClick={() => setFulfillOrder(null)} className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-slate-400 hover:bg-white/5">Avbryt</button>
              <button onClick={handleFulfill} disabled={fulfilling} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/15 py-2.5 text-sm font-semibold text-emerald-400 hover:bg-emerald-500/25 disabled:opacity-50">
                {fulfilling && <Loader2 size={14} className="animate-spin" />}
                Markera som levererad
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
