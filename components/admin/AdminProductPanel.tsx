"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  ShoppingBag,
  ExternalLink,
  ToggleLeft,
  ToggleRight,
  MousePointerClick,
  Zap,
  Coins,
  Link2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ProductRow = {
  id: string;
  name: string;
  description: string;
  priceSek: number;
  affiliateLink: string;
  imageUrl: string | null;
  xpReward: number;
  coinReward: number;
  category: string;
  isPremiumOnly: boolean;
  isFlashDeal: boolean;
  isActive: boolean;
  showOnHome: boolean;
  isOnSale: boolean;
  salePriceSek: number | null;
  expiresAt: string | null;
  createdAt: string;
  _count: { affiliateClicks: number; purchases: number };
};

type FormData = {
  name: string;
  description: string;
  priceSek: number;
  affiliateLink: string;
  imageUrl: string;
  xpReward: number;
  coinReward: number;
  category: string;
  isPremiumOnly: boolean;
  isFlashDeal: boolean;
  isActive: boolean;
  showOnHome: boolean;
  isOnSale: boolean;
  salePriceSek: number | null;
  expiresAt: string;
};

const EMPTY_FORM: FormData = {
  name: "",
  description: "",
  priceSek: 0,
  affiliateLink: "",
  imageUrl: "",
  xpReward: 0,
  coinReward: 0,
  category: "peripherals",
  isPremiumOnly: false,
  isFlashDeal: false,
  isActive: true,
  showOnHome: false,
  isOnSale: false,
  salePriceSek: null,
  expiresAt: "",
};

const CATEGORY_LABELS: Record<string, string> = {
  peripherals: "Tillbehör",
  hardware: "Hårdvara",
  games: "Spel",
  chairs: "Stolar",
  headsets: "Headsets",
  monitors: "Skärmar",
  streaming: "Streaming",
};

export default function AdminProductPanel() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      const res = await fetch("/api/admin/products");
      if (res.ok) setProducts(await res.json());
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

  function openEdit(product: ProductRow) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      description: product.description,
      priceSek: product.priceSek,
      affiliateLink: product.affiliateLink,
      imageUrl: product.imageUrl ?? "",
      xpReward: product.xpReward,
      coinReward: product.coinReward,
      category: product.category,
      isPremiumOnly: product.isPremiumOnly,
      isFlashDeal: product.isFlashDeal,
      isActive: product.isActive,
      showOnHome: product.showOnHome,
      isOnSale: product.isOnSale,
      salePriceSek: product.salePriceSek,
      expiresAt: product.expiresAt
        ? new Date(product.expiresAt).toISOString().slice(0, 16)
        : "",
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
        ? `/api/admin/products/${editingId}`
        : "/api/admin/products";
      const method = editingId ? "PUT" : "POST";

      const payload = {
        ...form,
        salePriceSek: form.isOnSale ? form.salePriceSek : null,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(typeof data.error === "string" ? data.error : "Validering misslyckades");
        return;
      }

      setShowForm(false);
      setEditingId(null);
      await loadProducts();
    } catch {
      setError("Nätverksfel");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Är du säker på att du vill ta bort denna produkt?")) return;

    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
      }
    } catch {
      /* ignore */
    }
  }

  async function handleToggleActive(product: ProductRow) {
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !product.isActive }),
      });
      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === product.id ? { ...p, isActive: !p.isActive } : p
          )
        );
      }
    } catch {
      /* ignore */
    }
  }

  const totalClicks = products.reduce((s, p) => s + p._count.affiliateClicks, 0);
  const activeCount = products.filter((p) => p.isActive).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-400/70">
            Produkthantering
          </p>
          <h2 className="text-xl font-bold text-white">Affiliate-produkter</h2>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-2.5 text-sm font-semibold text-emerald-400 transition-colors hover:bg-emerald-500/25"
        >
          <Plus size={16} /> Ny Produkt
        </button>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-slate-900/60 px-4 py-2.5">
          <ShoppingBag size={14} className="text-emerald-400" />
          <span className="text-xs text-slate-400">Produkter:</span>
          <span className="font-mono text-sm font-semibold text-white">{products.length}</span>
          <span className="text-[10px] text-slate-500">({activeCount} aktiva)</span>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-slate-900/60 px-4 py-2.5">
          <MousePointerClick size={14} className="text-amber-400" />
          <span className="text-xs text-slate-400">Totala klick:</span>
          <span className="font-mono text-sm font-semibold text-white">{totalClicks}</span>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="rounded-2xl border border-emerald-500/20 bg-slate-900/80 p-6 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">
              {editingId ? "Redigera Produkt" : "Skapa Produkt"}
            </h3>
            <button
              onClick={() => setShowForm(false)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            {/* Name */}
            <div className="sm:col-span-2">
              <label className="mb-1 block text-[11px] uppercase tracking-widest text-slate-500">
                Namn
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                maxLength={150}
                className="w-full rounded-xl border border-white/10 bg-slate-800/60 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500/50"
                placeholder="t.ex. Logitech G Pro X"
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
                maxLength={2000}
                rows={3}
                className="w-full resize-none rounded-xl border border-white/10 bg-slate-800/60 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500/50"
                placeholder="Produktbeskrivning..."
              />
            </div>

            {/* Affiliate Link */}
            <div className="sm:col-span-2">
              <label className="mb-1 flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-slate-500">
                <Link2 size={12} className="text-emerald-400" />
                Affiliate-länk
              </label>
              <input
                type="url"
                value={form.affiliateLink}
                onChange={(e) => setForm({ ...form, affiliateLink: e.target.value })}
                required
                maxLength={1000}
                className="w-full rounded-xl border border-white/10 bg-slate-800/60 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500/50"
                placeholder="https://www.partner-shop.se/product?ref=..."
              />
            </div>

            {/* Price */}
            <div>
              <label className="mb-1 block text-[11px] uppercase tracking-widest text-slate-500">
                Pris (SEK)
              </label>
              <input
                type="number"
                value={form.priceSek || ""}
                onChange={(e) => setForm({ ...form, priceSek: Number(e.target.value) })}
                required
                min={1}
                step={0.01}
                className="w-full rounded-xl border border-white/10 bg-slate-800/60 px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500/50"
                placeholder="1299"
              />
            </div>

            {/* Category */}
            <div>
              <label className="mb-1 block text-[11px] uppercase tracking-widest text-slate-500">
                Kategori
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-slate-800/60 px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500/50"
              >
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            {/* XP Reward */}
            <div>
              <label className="mb-1 block text-[11px] uppercase tracking-widest text-slate-500">
                XP-belöning
              </label>
              <input
                type="number"
                value={form.xpReward}
                onChange={(e) => setForm({ ...form, xpReward: Number(e.target.value) })}
                min={0}
                max={50000}
                className="w-full rounded-xl border border-white/10 bg-slate-800/60 px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500/50"
              />
            </div>

            {/* Coin Reward */}
            <div>
              <label className="mb-1 block text-[11px] uppercase tracking-widest text-slate-500">
                Coin-belöning
              </label>
              <input
                type="number"
                value={form.coinReward}
                onChange={(e) => setForm({ ...form, coinReward: Number(e.target.value) })}
                min={0}
                max={50000}
                className="w-full rounded-xl border border-white/10 bg-slate-800/60 px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500/50"
              />
            </div>

            {/* Image URL */}
            <div className="sm:col-span-2">
              <label className="mb-1 block text-[11px] uppercase tracking-widest text-slate-500">
                Bild-URL (valfri)
              </label>
              <input
                type="url"
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                maxLength={500}
                className="w-full rounded-xl border border-white/10 bg-slate-800/60 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500/50"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            {/* Toggles */}
            <div className="flex flex-wrap items-center gap-5 sm:col-span-2">
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
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={form.isPremiumOnly}
                  onChange={(e) => setForm({ ...form, isPremiumOnly: e.target.checked })}
                  className="sr-only"
                />
                {form.isPremiumOnly ? (
                  <ToggleRight size={22} className="text-purple-400" />
                ) : (
                  <ToggleLeft size={22} className="text-slate-500" />
                )}
                Bara Premium
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={form.isFlashDeal}
                  onChange={(e) => setForm({ ...form, isFlashDeal: e.target.checked })}
                  className="sr-only"
                />
                {form.isFlashDeal ? (
                  <ToggleRight size={22} className="text-amber-400" />
                ) : (
                  <ToggleLeft size={22} className="text-slate-500" />
                )}
                Flash Deal
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={form.showOnHome}
                  onChange={(e) => setForm({ ...form, showOnHome: e.target.checked })}
                  className="sr-only"
                />
                {form.showOnHome ? (
                  <ToggleRight size={22} className="text-neon-cyan" />
                ) : (
                  <ToggleLeft size={22} className="text-slate-500" />
                )}
                Visa på Hem
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={form.isOnSale}
                  onChange={(e) => setForm({ ...form, isOnSale: e.target.checked })}
                  className="sr-only"
                />
                {form.isOnSale ? (
                  <ToggleRight size={22} className="text-red-400" />
                ) : (
                  <ToggleLeft size={22} className="text-slate-500" />
                )}
                REA
              </label>
            </div>

            {/* Sale price */}
            {form.isOnSale && (
              <div>
                <label className="mb-1 block text-[11px] uppercase tracking-widest text-slate-500">
                  REA-pris (SEK)
                </label>
                <input
                  type="number"
                  value={form.salePriceSek ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, salePriceSek: e.target.value ? Number(e.target.value) : null })
                  }
                  min={1}
                  step={0.01}
                  className="w-full rounded-xl border border-white/10 bg-slate-800/60 px-4 py-2.5 text-sm text-white outline-none focus:border-red-400/50"
                  placeholder="999"
                />
              </div>
            )}

            {/* Expiry */}
            <div>
              <label className="mb-1 block text-[11px] uppercase tracking-widest text-slate-500">
                Utgångsdatum (lämna tomt = ingen utgång)
              </label>
              <input
                type="datetime-local"
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-slate-800/60 px-4 py-2.5 text-sm text-white outline-none focus:border-amber-400/50"
              />
            </div>

            {error && (
              <p className="rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs text-red-400 sm:col-span-2">
                {error}
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-2 sm:col-span-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-slate-400 transition-colors hover:bg-white/5"
              >
                Avbryt
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/15 py-2.5 text-sm font-semibold text-emerald-400 transition-colors hover:bg-emerald-500/25 disabled:opacity-50"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                {editingId ? "Uppdatera" : "Skapa"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Product list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={22} className="animate-spin text-emerald-400/50" />
        </div>
      ) : products.length === 0 ? (
        <p className="rounded-2xl border border-white/5 bg-slate-900/40 py-12 text-center text-sm text-slate-500">
          Inga produkter ännu. Klicka &quot;Ny Produkt&quot; för att lägga till.
        </p>
      ) : (
        <div className="space-y-2">
          {products.map((product) => (
            <div
              key={product.id}
              className={cn(
                "group rounded-xl border border-white/5 bg-slate-900/50 p-4 transition-colors hover:bg-slate-900/70",
                !product.isActive && "opacity-50"
              )}
            >
              <div className="flex items-start gap-4">
                {/* Image thumbnail */}
                {product.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="h-14 w-14 flex-shrink-0 rounded-lg border border-white/10 object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg border border-white/10 bg-slate-800">
                    <ShoppingBag size={18} className="text-slate-500" />
                  </div>
                )}

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="truncate font-semibold text-white">{product.name}</h4>
                    {product.isOnSale && (
                      <span className="rounded-full border border-red-400/30 bg-red-500/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-red-400">
                        REA
                      </span>
                    )}
                    {product.isFlashDeal && (
                      <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-amber-400">
                        Flash
                      </span>
                    )}
                    {product.isPremiumOnly && (
                      <span className="rounded-full border border-purple-400/30 bg-purple-500/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-purple-400">
                        Premium
                      </span>
                    )}
                    {product.expiresAt && (
                      <span className="rounded-full border border-orange-400/30 bg-orange-500/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-orange-400">
                        Utgår {new Date(product.expiresAt).toLocaleDateString("sv-SE")}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-slate-400">{product.description}</p>

                  {/* Meta row */}
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px]">
                    {product.isOnSale && product.salePriceSek ? (
                      <span className="font-mono font-semibold text-red-400">
                        {product.salePriceSek.toLocaleString("sv-SE")} kr{" "}
                        <span className="text-slate-500 line-through">{product.priceSek.toLocaleString("sv-SE")} kr</span>
                      </span>
                    ) : (
                    <span className="font-mono font-semibold text-emerald-400">
                      {product.priceSek.toLocaleString("sv-SE")} kr
                    </span>
                    )}
                    <span className="text-slate-500">
                      {CATEGORY_LABELS[product.category] ?? product.category}
                    </span>
                    <span className="flex items-center gap-1 text-neon-cyan">
                      <Zap size={10} /> +{product.xpReward} XP
                    </span>
                    <span className="flex items-center gap-1 text-neon-cyan">
                      <Coins size={10} /> +{product.coinReward}
                    </span>
                    <span className="flex items-center gap-1 text-amber-400">
                      <MousePointerClick size={10} /> {product._count.affiliateClicks} klick
                    </span>
                    {product.affiliateLink && (
                      <a
                        href={product.affiliateLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-slate-500 transition-colors hover:text-white"
                        title={product.affiliateLink}
                      >
                        <ExternalLink size={10} /> Länk
                      </a>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-shrink-0 items-center gap-1.5">
                  <button
                    onClick={() => handleToggleActive(product)}
                    className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
                    title={product.isActive ? "Inaktivera" : "Aktivera"}
                  >
                    {product.isActive ? (
                      <ToggleRight size={18} className="text-emerald-400" />
                    ) : (
                      <ToggleLeft size={18} className="text-slate-500" />
                    )}
                  </button>
                  <button
                    onClick={() => openEdit(product)}
                    className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
                    title="Redigera"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-400"
                    title="Ta bort"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
