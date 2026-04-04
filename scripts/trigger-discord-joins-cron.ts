import { runDiscordJoinSync } from "@/lib/discord-join-sync";

async function main() {
  console.log("[cron:discord-joins] Starting sync...");
  const result = await runDiscordJoinSync();
  console.log("[cron:discord-joins] OK", JSON.stringify(result));
}

main().catch((error) => {
  console.error("[cron:discord-joins] ERROR", error);
  process.exit(1);
});
