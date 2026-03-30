import path from "node:path";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrate: {
    // directUrl is used by Prisma Migrate to bypass the connection pooler
    async adapter() {
      const { PrismaPg } = await import("@prisma/adapter-pg");
      const { Pool } = await import("pg");
      const pool = new Pool({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL });
      return new PrismaPg(pool);
    },
  },
});
