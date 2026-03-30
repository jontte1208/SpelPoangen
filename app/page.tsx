"use client";

import LootMarketSection from "@/components/market/LootMarketSection";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#020617] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <LootMarketSection />
      </div>
    </main>
  );
}
