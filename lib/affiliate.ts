import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { addXP } from "@/lib/gamification";
import type { Product } from "@/types/products";

// ------------------------------------
// generateTrackingLink
// ------------------------------------

export async function generateTrackingLink(
  userId: string,
  product: Product
): Promise<string> {
  const subId = randomUUID();

  await prisma.affiliateClick.create({
    data: {
      userId,
      productId: product.id,
      subId,
      status: "PENDING",
    },
  });

  // Append subid to the affiliate URL, preserving any existing query params
  const url = new URL(product.affiliateLink);
  url.searchParams.set("subid", subId);
  return url.toString();
}

// ------------------------------------
// processAffiliateConversion (CSV import)
// ------------------------------------

// Supported status strings from Adrecord / Tradedoubler / Awin
const VERIFIED_STATUSES = new Set([
  "approved",
  "verified",
  "confirmed",
  "accepted",
]);
const REJECTED_STATUSES = new Set(["rejected", "denied", "declined", "cancelled", "canceled"]);

export type ConversionResult = {
  processed: number;
  rewarded: number;
  skipped: number;
  errors: string[];
};

/**
 * Parses a CSV export from an affiliate network and awards XP/coins for
 * verified conversions.
 *
 * Expected columns (case-insensitive, any order):
 *   subid | click_id | clickid   — our tracking subId
 *   status | order_status        — conversion status
 *   order_value | amount | sale  — optional, for logging
 *
 * @param csvText Raw CSV string (including header row)
 */
export async function processAffiliateConversion(
  csvText: string
): Promise<ConversionResult> {
  const result: ConversionResult = {
    processed: 0,
    rewarded: 0,
    skipped: 0,
    errors: [],
  };

  const rows = parseCSV(csvText);
  if (rows.length < 2) {
    result.errors.push("CSV is empty or has no data rows");
    return result;
  }

  const headers = rows[0].map((h) => h.toLowerCase().trim());
  const subIdCol = findColumn(headers, ["subid", "sub_id", "click_id", "clickid"]);
  const statusCol = findColumn(headers, ["status", "order_status", "conversion_status"]);

  if (subIdCol === -1) {
    result.errors.push("Could not find a subid column (tried: subid, sub_id, click_id, clickid)");
    return result;
  }
  if (statusCol === -1) {
    result.errors.push("Could not find a status column (tried: status, order_status, conversion_status)");
    return result;
  }

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length <= Math.max(subIdCol, statusCol)) continue;

    const subId = row[subIdCol].trim();
    const rawStatus = row[statusCol].trim().toLowerCase();
    result.processed++;

    if (!subId) {
      result.skipped++;
      continue;
    }

    const isVerified = VERIFIED_STATUSES.has(rawStatus);
    const isRejected = REJECTED_STATUSES.has(rawStatus);

    if (!isVerified && !isRejected) {
      // Still pending — skip for now
      result.skipped++;
      continue;
    }

    const click = await prisma.affiliateClick.findUnique({
      where: { subId },
      include: { product: true },
    });

    if (!click) {
      result.errors.push(`Row ${i + 1}: subId "${subId}" not found in database`);
      result.skipped++;
      continue;
    }

    if (click.status !== "PENDING") {
      // Already processed
      result.skipped++;
      continue;
    }

    if (isRejected) {
      await prisma.affiliateClick.update({
        where: { subId },
        data: { status: "REJECTED" },
      });
      result.skipped++;
      continue;
    }

    // Verified — award rewards
    await prisma.affiliateClick.update({
      where: { subId },
      data: { status: "VERIFIED" },
    });

    if (click.userId) {
      const xpReward = click.product.xpReward;
      const coinReward = click.product.coinReward;

      await addXP(click.userId, xpReward);

      if (coinReward > 0) {
        await prisma.user.update({
          where: { id: click.userId },
          data: { coins: { increment: coinReward } },
        });
      }

      // Referral bonus: 25% of XP to whoever referred the buyer
      const buyer = await prisma.user.findUnique({
        where: { id: click.userId },
        select: { referredBy: true },
      });

      if (buyer?.referredBy) {
        const referrer = await prisma.user.findUnique({
          where: { affiliateCode: buyer.referredBy },
          select: { id: true },
        });
        if (referrer) {
          await addXP(referrer.id, Math.floor(xpReward * 0.25));
        }
      }
    }

    result.rewarded++;
  }

  return result;
}

// ------------------------------------
// CSV helpers
// ------------------------------------

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");

  for (const line of lines) {
    if (!line.trim()) continue;
    rows.push(splitCSVLine(line));
  }

  return rows;
}

function splitCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += ch;
    }
  }

  fields.push(current);
  return fields;
}

function findColumn(headers: string[], candidates: string[]): number {
  for (const candidate of candidates) {
    const idx = headers.indexOf(candidate);
    if (idx !== -1) return idx;
  }
  return -1;
}
