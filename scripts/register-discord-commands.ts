// Run once to register slash commands with Discord:
//   npx tsx scripts/register-discord-commands.ts
//
// Requires in .env.local:
//   DISCORD_BOT_TOKEN
//   DISCORD_APPLICATION_ID

import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const commands = [
  {
    name: "profil",
    description: "Visa din SpelPoängen-profil med level, XP, streak och stats.",
  },
  {
    name: "topplista",
    description: "Visa topp 10 spelare med mest XP på SpelPoängen.",
  },
  {
    name: "quests",
    description: "Se veckans aktiva utmaningar och din progress.",
  },
];

async function register() {
  const token = process.env.DISCORD_BOT_TOKEN;
  const appId = process.env.DISCORD_APPLICATION_ID;

  if (!token || !appId) {
    console.error("❌ Missing DISCORD_BOT_TOKEN or DISCORD_APPLICATION_ID in .env.local");
    process.exit(1);
  }

  console.log(`Registering ${commands.length} slash commands for application ${appId}...`);

  const res = await fetch(`https://discord.com/api/v10/applications/${appId}/commands`, {
    method: "PUT",
    headers: {
      Authorization: `Bot ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(commands),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("❌ Failed to register commands:", err);
    process.exit(1);
  }

  const data = (await res.json()) as { name: string }[];
  console.log(`✅ Registered: ${data.map((c) => "/" + c.name).join("  ")}`);
  console.log("\nNext steps:");
  console.log("1. Go to Discord Developer Portal → Your App → General Information");
  console.log("2. Set 'Interactions Endpoint URL' to:");
  console.log("   https://<your-domain>/api/discord/interactions");
  console.log("3. Save — Discord will verify the endpoint automatically.");
}

register();
