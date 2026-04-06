"use client";

import { useState, useTransition } from "react";
import { Coins, ShoppingCart, Clock, CheckCircle, XCircle, Package, Zap, Loader2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type ShopItem = {
  id: string;
  name: string;
  description: string;
  coinCost: number;
  stock: number;
  category: "DIGITAL" | "PHYSICAL";
  imageUrl: string | null;
};

type Order = {
  id: string;
  coinsSpent: number;
  status: string;
  createdAt: string;
  fulfilledAt: string | null;
  redemptionCode: string | null;
  shopItem: { name: string; imageUrl: string | null; category: string };
};

type Props = {
  initialItems: ShopItem[];
  initialCoins: number;
  initialOrders: Order[];
};

const STATUS_LABEL: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  PENDING: { label: "Väntar", icon: Clock, color: "text-amber-400" },
  CONFIRMED: { label: "Bekräftad", icon: CheckCircle, color: "text-neon-cyan" },
  FULFILLED: { label: "Levererad", icon: CheckCircle, color: "text-emerald-400" },
  CANCELLED: { label: "Avbruten", icon: XCircle, color: "text-red-400" },
};

export default function LootShopClient({ initialItems, initialCoins, initialOrders }: Props) {
  const [coins, setCoins] = useState(initialCoins);
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [tab, setTab] = useState<"shop" | "history">("shop");
  const [isPending, startTransition] = useTransition();
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [confirmItem, setConfirmItem] = useState<ShopItem | null>(null);

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  }

  function handleBuy(item: ShopItem) {
    if (coins < item.coinCost) {
      showToast(`Du behöver ${item.coinCost - coins} coins till.`, false);
      return;
    }
    setConfirmItem(item);
  }

  function confirmPurchase() {
    if (!confirmItem) return;
    const item = confirmItem;
    setConfirmItem(null);
    setPurchasing(item.id);

    startTransition(async () => {
      try {
        const res = await fetch("/api/loot-shop/purchase", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shopItemId: item.id }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast(data.error ?? "Köpet misslyckades.", false);
        } else {
          setCoins((c) => c - item.coinCost);
          // Reload orders
          const ordRes = await fetch("/api/loot-shop/orders");
          if (ordRes.ok) setOrders(await ordRes.json());
          showToast(
            item.category === "DIGITAL"
              ? "Köpet genomfört! Aktiveras automatiskt."
              : "Order skapad! Vi skickar koden till dig snart.",
            true
          );
        }
      } catch {
        showToast("Nätverksfel, försök igen.", false);
      } finally {
        setPurchasing(null);
      }
    });
  }

  return (
    <main className="space-y-6">
      {/* Header */}
      <section className="rounded-2xl border border-white/5 bg-slate-900/40 p-5 backdrop-blur-md">
        <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-neon-cyan/70">Loot Shop</p>
        <h1 className="mt-2 font-display text-4xl font-semibold text-white sm:text-5xl">Lös in dina Coins</h1>
        <p className="mt-2 text-sm text-slate-400">Byt dina intjänade coins mot riktiga belöningar.</p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-neon-cyan/30 bg-neon-cyan/10 px-4 py-2">
          <Coins size={16} className="text-neon-cyan" />
          <span className="font-display text-2xl font-semibold text-neon-cyan">{coins.toLocaleString("sv-SE")}</span>
          <span className="text-xs text-slate-400">coins</span>
        </div>
      </section>

      {/* Tabs */}
      <div className="flex gap-2 rounded-2xl border border-white/5 bg-slate-900/50 p-1.5">
        {(["shop", "history"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all",
              tab === t
                ? "border border-neon-cyan/30 bg-neon-cyan/15 text-neon-cyan"
                : "border border-transparent text-slate-400 hover:text-white"
            )}
          >
            {t === "shop" ? <><ShoppingCart size={15} /> Shop</> : <><Clock size={15} /> Köphistorik</>}
          </button>
        ))}
      </div>

      {/* Shop grid */}
      {tab === "shop" && (
        initialItems.length === 0 ? (
          <p className="rounded-2xl border border-white/5 bg-slate-900/40 py-16 text-center text-sm text-slate-500">
            Inga artiklar i shoppen just nu. Kolla tillbaka snart!
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {initialItems.map((item) => {
              const canAfford = coins >= item.coinCost;
              const soldOut = item.stock === 0;
              return (
                <div
                  key={item.id}
                  className={cn(
                    "group overflow-hidden rounded-2xl border bg-slate-900/40 backdrop-blur-md transition-all duration-300",
                    canAfford && !soldOut ? "border-white/5 hover:shadow-neon-soft" : "border-white/5 opacity-70"
                  )}
                >
                  {/* Image */}
                  <div className="relative flex h-44 items-center justify-center bg-slate-950/60">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.imageUrl} alt={item.name} className="h-full w-full object-contain p-4" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Package size={48} className="text-slate-700" />
                      </div>
                    )}
                    <span className={cn(
                      "absolute left-3 top-3 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] backdrop-blur-sm",
                      item.category === "DIGITAL"
                        ? "border-neon-cyan/40 bg-neon-cyan/15 text-neon-cyan"
                        : "border-amber-400/40 bg-amber-500/15 text-amber-400"
                    )}>
                      {item.category === "DIGITAL" ? <><Zap size={8} className="inline mr-1" />Digital</> : "📦 Fysisk"}
                    </span>
                    {soldOut && (
                      <span className="absolute right-3 top-3 rounded-full border border-red-400/40 bg-red-500/15 px-2.5 py-1 text-[10px] font-semibold uppercase text-red-400 backdrop-blur-sm">
                        Slutsåld
                      </span>
                    )}
                    {!soldOut && item.stock > 0 && (
                      <span className="absolute right-3 top-3 rounded-full border border-white/10 bg-slate-950/80 px-2.5 py-1 text-[10px] text-slate-400 backdrop-blur-sm">
                        {item.stock} kvar
                      </span>
                    )}
                  </div>

                  <div className="space-y-3 p-5">
                    <h3 className="font-display text-lg font-semibold text-white">{item.name}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2">{item.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Coins size={14} className="text-neon-cyan" />
                        <span className="font-display text-xl font-semibold text-neon-cyan">
                          {item.coinCost.toLocaleString("sv-SE")}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleBuy(item)}
                        disabled={!canAfford || soldOut || (isPending && purchasing === item.id)}
                        className={cn(
                          "flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-semibold uppercase tracking-[0.15em] transition-all",
                          canAfford && !soldOut
                            ? "border-neon-cyan/40 text-neon-cyan hover:bg-neon-cyan hover:text-slate-950"
                            : "border-white/10 text-slate-600 cursor-not-allowed"
                        )}
                      >
                        {isPending && purchasing === item.id ? <Loader2 size={14} className="animate-spin" /> : null}
                        {soldOut ? "Slutsåld" : canAfford ? "Köp" : "Inte råd"}
                      </button>
                    </div>
                    {!canAfford && !soldOut && (
                      <p className="text-[11px] text-slate-500">
                        Du saknar {(item.coinCost - coins).toLocaleString("sv-SE")} coins
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Purchase history */}
      {tab === "history" && (
        orders.length === 0 ? (
          <p className="rounded-2xl border border-white/5 bg-slate-900/40 py-16 text-center text-sm text-slate-500">
            Inga köp ännu. Gå till Shop-fliken och lös in dina coins!
          </p>
        ) : (
          <div className="space-y-2">
            {orders.map((order) => {
              const s = STATUS_LABEL[order.status] ?? STATUS_LABEL.PENDING;
              const Icon = s.icon;
              return (
                <div key={order.id} className="rounded-xl border border-white/5 bg-slate-900/50 p-4">
                  <div className="flex items-start gap-4">
                    {order.shopItem.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={order.shopItem.imageUrl} alt={order.shopItem.name} className="h-12 w-12 rounded-lg object-contain bg-slate-950/60 p-1 border border-white/10" />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-white/10 bg-slate-800">
                        <Package size={18} className="text-slate-500" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-white">{order.shopItem.name}</p>
                      <p className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleDateString("sv-SE", { day: "numeric", month: "long", year: "numeric" })}</p>
                      {order.redemptionCode && (
                        <div className="mt-2 flex items-center gap-2 rounded-lg border border-emerald-400/20 bg-emerald-500/10 px-3 py-1.5">
                          <Info size={12} className="text-emerald-400" />
                          <span className="font-mono text-sm font-semibold text-emerald-400">{order.redemptionCode}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <div className={cn("flex items-center gap-1 text-sm font-semibold", s.color)}>
                        <Icon size={14} /> {s.label}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Coins size={11} /> {order.coinsSpent.toLocaleString("sv-SE")}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Confirm modal */}
      {confirmItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm" onClick={() => setConfirmItem(null)}>
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#010f1e] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-xl font-semibold text-white">Bekräfta köp</h3>
            <p className="mt-2 text-sm text-slate-400">{confirmItem.name}</p>
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-neon-cyan/20 bg-neon-cyan/5 px-4 py-3">
              <Coins size={16} className="text-neon-cyan" />
              <span className="text-neon-cyan font-semibold">{confirmItem.coinCost.toLocaleString("sv-SE")} coins</span>
              <span className="text-slate-500 text-sm ml-auto">→ {(coins - confirmItem.coinCost).toLocaleString("sv-SE")} kvar</span>
            </div>
            <div className="mt-5 flex gap-2">
              <button onClick={() => setConfirmItem(null)} className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-slate-400 hover:bg-white/5">
                Avbryt
              </button>
              <button onClick={confirmPurchase} className="flex-1 rounded-xl border border-neon-cyan/40 bg-neon-cyan/15 py-2.5 text-sm font-semibold text-neon-cyan hover:bg-neon-cyan/25">
                Bekräfta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={cn(
          "fixed bottom-6 right-6 z-50 rounded-xl border px-5 py-3 text-sm font-semibold shadow-xl backdrop-blur-md",
          toast.ok
            ? "border-emerald-400/30 bg-emerald-500/20 text-emerald-300"
            : "border-red-400/30 bg-red-500/20 text-red-300"
        )}>
          {toast.msg}
        </div>
      )}
    </main>
  );
}
