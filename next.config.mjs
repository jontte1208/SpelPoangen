/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      "@prisma/client",
      "prisma",
      "pg",
      "@prisma/adapter-pg",
    ],
  },
};

export default nextConfig;
