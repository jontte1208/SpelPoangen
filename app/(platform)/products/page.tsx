import InteractiveProductsGrid from "@/components/products/InteractiveProductsGrid";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Produkter" };

export default async function ProductsPage() {
  let products: { name: string; price: string; image: string; affiliateLink: string }[] = [];

  try {
    const now = new Date();
    const dbProducts = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: { createdAt: "desc" },
      select: {
        name: true,
        priceSek: true,
        salePriceSek: true,
        isOnSale: true,
        imageUrl: true,
        affiliateLink: true,
      },
    });

    const fmt = (n: number) =>
      new Intl.NumberFormat("sv-SE", { style: "currency", currency: "SEK", minimumFractionDigits: 0 }).format(n);

    products = dbProducts.map((p) => ({
      name: p.name,
      price: fmt(p.priceSek),
      salePrice: p.isOnSale && p.salePriceSek ? fmt(p.salePriceSek) : undefined,
      isOnSale: p.isOnSale,
      image:
        p.imageUrl ??
        "https://images.unsplash.com/photo-1593640408182-31c228c5d4b0?auto=format&fit=crop&w=1200&q=80",
      affiliateLink: p.affiliateLink,
    }));
  } catch {
    products = [];
  }

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

      {products.length === 0 ? (
        <p className="rounded-2xl border border-white/5 bg-slate-900/40 py-12 text-center text-sm text-slate-500">
          Inga produkter just nu. Kolla tillbaka snart!
        </p>
      ) : (
        <InteractiveProductsGrid products={products} />
      )}
    </main>
  );
}
