import { Card } from "@/components/ui/Card";
import InteractiveProductsGrid from "@/components/products/InteractiveProductsGrid";
import Link from "next/link";

export const metadata = { title: "Produkter" };

const liveStockSignals = [
  { name: "Razer Viper 8K", status: "7 kvar", href: "/shop", isLowStock: false },
  { name: "SteelSeries Apex Pro", status: "12 kvar", href: "/shop", isLowStock: false },
  { name: "Corsair Vengeance", status: "Low stock", href: "/shop", isLowStock: true },
];

const productGrid = [
  {
    name: "ASUS ROG Swift OLED",
    price: "14 990 kr",
    affiliateLink: "https://www.inet.se/produkt/2220814/asus-rog-swift-oled-pg32ucdm",
    image:
      "https://images.unsplash.com/photo-1593640408182-31c228c5d4b0?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Logitech G Pro X Superlight",
    price: "1 790 kr",
    affiliateLink: "https://www.inet.se/produkt/6610168/logitech-g-pro-x-superlight-2",
    image:
      "https://images.unsplash.com/photo-1629429407759-01cd3d7cfb38?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Elgato Stream Deck XL",
    price: "2 590 kr",
    affiliateLink: "https://www.inet.se/produkt/6609644/elgato-stream-deck-xl",
    image:
      "https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "SteelSeries Arctis Nova Pro",
    price: "3 490 kr",
    affiliateLink: "https://www.inet.se/produkt/6609899/steelseries-arctis-nova-pro",
    image:
      "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1200&q=80",
  },
];

export default function ProductsPage() {
  return (
    <main className="space-y-6">
      <section className="rounded-2xl border border-white/5 bg-slate-900/40 p-5 backdrop-blur-md">
        <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-neon-cyan/70">
          Produkter
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold text-white sm:text-5xl">
          Produktfloden
        </h1>
        <p className="mt-3 max-w-3xl text-base text-slate-300">
          Dagens hetaste tech-loot med XP-bonus
        </p>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <Card className="group relative overflow-hidden rounded-2xl border border-neon-cyan/40 bg-slate-900/40 p-5 shadow-none transition-all duration-300 hover:shadow-neon-soft xl:col-span-2">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(34,211,238,0.18),transparent_55%)]" />

          <div className="relative">
            <p className="inline-flex rounded-full border border-neon-cyan/40 bg-neon-cyan/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-neon-cyan">
              Featured Drop
            </p>

            <div className="mt-4 grid gap-4 md:grid-cols-[1.3fr_1fr] md:items-center">
              <div>
                <h2 className="font-display text-3xl font-semibold text-white sm:text-4xl">
                  Alienware Aurora R16
                </h2>
                <p className="mt-3 text-sm text-slate-300">
                  Maxad performance med RTX-klassad grafik, premium kylning och en clean setup-profil for gaming i 240 FPS.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full border border-neon-cyan/35 bg-slate-950/80 px-2.5 py-1 text-[11px] uppercase tracking-[0.2em] text-neon-cyan">
                    +480 XP
                  </span>
                  <span className="rounded-full border border-neon-cyan/35 bg-slate-950/80 px-2.5 py-1 text-[11px] uppercase tracking-[0.2em] text-neon-cyan">
                    +110 Coins
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-white/5 bg-slate-950/70 p-4">
                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Featured Price</p>
                <p className="mt-2 font-display text-3xl font-semibold text-neon-cyan">24 990 kr</p>
                <Link
                  href="/shop"
                  className="mt-4 inline-flex rounded-xl border border-neon-cyan/40 px-4 py-2 text-sm font-semibold uppercase tracking-[0.18em] text-neon-cyan transition-colors hover:bg-neon-cyan hover:text-slate-950"
                >
                  Kolla droppet
                </Link>
              </div>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border border-white/5 bg-slate-900/40 p-5 shadow-none">
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-neon-cyan/70">Flash Signals</p>
          <h3 className="mt-3 font-display text-2xl font-semibold text-white">Lagerstatus live</h3>
          <div className="mt-4 space-y-2">
            {liveStockSignals.map((item) => (
              <Link key={item.name} href={item.href} className="block">
                <div className="rounded-2xl border border-white/5 bg-slate-900/40 p-3 transition-all hover:border-neon-cyan/35 hover:bg-slate-900/65">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <span className="text-sm text-slate-200">{item.name}</span>
                      <div className="mt-1 text-[11px] font-semibold text-neon-cyan transition-colors hover:text-white">
                        Kolla in den nu -&gt;
                      </div>
                    </div>
                    <span
                      className={item.isLowStock
                        ? "text-xs font-semibold text-red-400 animate-pulse"
                        : "text-xs font-semibold text-neon-cyan"
                      }
                    >
                      {item.status}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </section>

      <InteractiveProductsGrid products={productGrid} />
    </main>
  );
}