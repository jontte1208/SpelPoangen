import ProductGrid from "@/components/shop/ProductGrid";
import { SectionIntro } from "@/components/dashboard/SectionIntro";

export const metadata = { title: "Butik" };

export default async function ShopPage() {
  return (
    <main>
      <SectionIntro
        eyebrow="Butik"
        title="Featured gear och rewards"
        description="Produkter och affiliate rewards ligger nu i en riktig route i App Router, sa du kan hoppa hit utan att fastna i en intern tab-state."
      />
      <ProductGrid />
    </main>
  );
}