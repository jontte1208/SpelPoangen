import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const discordId = process.argv[2] ?? process.env.DISCORD_ID;

  if (!discordId) {
    throw new Error("Missing Discord ID. Usage: npm run user:make-admin -- <discordId>");
  }

  const updatedCount = await prisma.$executeRaw(
    Prisma.sql`UPDATE "User" SET "role" = 'ADMIN' WHERE "discordId" = ${discordId}`
  );

  if (updatedCount === 0) {
    throw new Error(`No user found with discordId '${discordId}'.`);
  }

  const rows = await prisma.$queryRaw<Array<{
    id: string;
    discordId: string | null;
    role: string;
    isBanned: boolean;
    name: string | null;
    email: string | null;
  }>>(
    Prisma.sql`
      SELECT "id", "discordId", "role", "isBanned", "name", "email"
      FROM "User"
      WHERE "discordId" = ${discordId}
      LIMIT 1
    `
  );

  const updated = rows[0] ?? null;

  console.log("User updated to ADMIN:");
  console.log(updated);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
