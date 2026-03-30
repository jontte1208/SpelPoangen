import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const sampleProducts = [
  {
    name: "Razer DeathAdder V3 Pro",
    description: "Lightweight esports mouse with Focus Pro sensor and ultra-low click latency.",
    priceSek: 1799,
    imageUrl:
      "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=1200&q=80",
    affiliateLink: "https://example.com/products/razer-deathadder-v3-pro",
    xpReward: 25,
    coinReward: 10,
    category: "peripherals",
    isPremiumOnly: false,
    isFlashDeal: true,
    isActive: true,
  },
  {
    name: "SteelSeries Arctis Nova Pro",
    description: "Premium gaming headset with spatial audio, hot-swappable batteries, and DAC.",
    priceSek: 3490,
    imageUrl:
      "https://images.unsplash.com/photo-1585298723682-7115561c51b7?auto=format&fit=crop&w=1200&q=80",
    affiliateLink: "https://example.com/products/steelseries-arctis-nova-pro",
    xpReward: 40,
    coinReward: 18,
    category: "headsets",
    isPremiumOnly: true,
    isFlashDeal: false,
    isActive: true,
  },
  {
    name: "Logitech G Pro X Superlight 2",
    description: "Tournament-grade wireless mouse built for speed, precision, and low-weight control.",
    priceSek: 1990,
    imageUrl:
      "https://images.unsplash.com/photo-1629429407756-01cd3d7cfb38?auto=format&fit=crop&w=1200&q=80",
    affiliateLink: "https://example.com/products/logitech-g-pro-x-superlight-2",
    xpReward: 30,
    coinReward: 12,
    category: "peripherals",
    isPremiumOnly: false,
    isFlashDeal: false,
    isActive: true,
  },
  {
    name: "ASUS TUF 27\" 165Hz Gaming Monitor",
    description: "Fast IPS gaming monitor with 165Hz refresh rate and low-latency response time.",
    priceSek: 2890,
    imageUrl:
      "https://images.unsplash.com/photo-1527443154391-507e9dc6c5cc?auto=format&fit=crop&w=1200&q=80",
    affiliateLink: "https://example.com/products/asus-tuf-27-165hz-monitor",
    xpReward: 35,
    coinReward: 15,
    category: "monitors",
    isPremiumOnly: false,
    isFlashDeal: true,
    isActive: true,
  },
  {
    name: "Elgato Stream Deck MK.2",
    description: "Customizable macro controller for streaming, shortcuts, scenes, and creator workflows.",
    priceSek: 1890,
    imageUrl:
      "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?auto=format&fit=crop&w=1200&q=80",
    affiliateLink: "https://example.com/products/elgato-stream-deck-mk2",
    xpReward: 28,
    coinReward: 11,
    category: "streaming",
    isPremiumOnly: false,
    isFlashDeal: false,
    isActive: true,
  },
] as const;

async function main() {
  await prisma.product.deleteMany({
    where: {
      name: {
        in: sampleProducts.map((product) => product.name),
      },
    },
  });

  await prisma.product.createMany({
    data: sampleProducts.map((product) => ({ ...product })),
  });

  console.log(`Seeded ${sampleProducts.length} products.`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });