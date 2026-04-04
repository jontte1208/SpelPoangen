function resolveBaseUrl(): string | null {
  const explicit = process.env.CRON_TARGET_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (appUrl) return appUrl.replace(/\/$/, "");

  const railwayDomain = process.env.RAILWAY_PUBLIC_DOMAIN?.trim();
  if (railwayDomain) {
    const normalized = railwayDomain.replace(/^https?:\/\//, "").replace(/\/$/, "");
    return `https://${normalized}`;
  }

  return null;
}

async function main() {
  const baseUrl = resolveBaseUrl();
  const secret = process.env.CRON_SECRET?.trim();

  if (!baseUrl) {
    throw new Error("Missing CRON_TARGET_URL/NEXT_PUBLIC_APP_URL/RAILWAY_PUBLIC_DOMAIN for cron target URL.");
  }

  if (!secret) {
    throw new Error("Missing CRON_SECRET.");
  }

  const endpoint = `${baseUrl}/api/cron/discord-joins`;

  const res = await fetch(endpoint, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${secret}`,
    },
  });

  const body = await res.text();

  if (!res.ok) {
    throw new Error(`Discord join cron failed (${res.status}): ${body}`);
  }

  console.log(`[cron:discord-joins] OK (${res.status}) ${body}`);
}

main().catch((error) => {
  console.error("[cron:discord-joins] ERROR", error);
  process.exit(1);
});
