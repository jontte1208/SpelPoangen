/**
 * Apply quest-system migration directly via pg Pool.
 *
 * This bypasses `prisma migrate deploy` which cannot reach Supabase
 * from Railway (and the pooler doesn't support the Prisma schema engine).
 *
 * Usage: npx tsx scripts/apply-quest-migration.ts
 */
import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config({ path: ".env.local" });

const connectionString = (
  process.env.DATABASE_URL ?? process.env.DIRECT_URL ?? ""
).trim().replace(/^['"]|['"]$/g, "");

if (!connectionString) {
  console.error("DATABASE_URL or DIRECT_URL is missing");
  process.exit(1);
}

const pool = new Pool({ connectionString });

const MIGRATION_SQL = `
-- Add progress tracking columns to UserQuest
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'UserQuest' AND column_name = 'progress'
  ) THEN
    ALTER TABLE "UserQuest"
    ADD COLUMN "progress" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "isClaimed" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

    -- Mark existing rows as claimed (they were completion markers in old schema)
    UPDATE "UserQuest"
    SET "isCompleted" = true, "isClaimed" = true
    WHERE "completedAt" IS NOT NULL;

    ALTER TABLE "UserQuest" DROP COLUMN IF EXISTS "completedAt";
  END IF;
END $$;

-- Create UserProductView table for loot-scout quest tracking
CREATE TABLE IF NOT EXISTS "UserProductView" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserProductView_pkey" PRIMARY KEY ("id")
);

-- Unique index (idempotent)
CREATE UNIQUE INDEX IF NOT EXISTS "UserProductView_userId_productId_key"
ON "UserProductView"("userId", "productId");

-- Foreign keys (idempotent check)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'UserProductView_userId_fkey'
  ) THEN
    ALTER TABLE "UserProductView"
    ADD CONSTRAINT "UserProductView_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'UserProductView_productId_fkey'
  ) THEN
    ALTER TABLE "UserProductView"
    ADD CONSTRAINT "UserProductView_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
`;

async function main() {
  console.log("Connecting to database...");
  const client = await pool.connect();

  try {
    console.log("Applying quest-system migration...");
    await client.query(MIGRATION_SQL);
    console.log("Migration applied successfully.");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
