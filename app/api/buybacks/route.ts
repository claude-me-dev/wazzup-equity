import { NextResponse } from "next/server";
import { BUYBACK_WALLETS, TOKEN } from "@/lib/config";
import { cached } from "@/lib/cache";
import { getAddressTransactions, type HeliusParsedTx } from "@/lib/helius";

export const runtime = "nodejs";
export const revalidate = 120;

export interface BuybackEvent {
  signature: string;
  timestamp: number;
  wallet: string;
  walletLabel: string;
  wazzupReceived: number;
  solSpent: number;
}

export interface BuybacksPayload {
  windowDays: number;
  events: BuybackEvent[];
  totals: {
    wazzupBought: number;
    solSpent: number;
    byWallet: Record<string, { wazzupBought: number; solSpent: number; count: number }>;
    daily: Array<{ date: string; wazzup: number; sol: number }>;
  };
  updatedAt: number;
}

function extractBuyback(tx: HeliusParsedTx, wallet: string): BuybackEvent | null {
  const received = (tx.tokenTransfers ?? [])
    .filter((t) => t.mint === TOKEN.mint && t.toUserAccount === wallet)
    .reduce((s, t) => s + (t.tokenAmount || 0), 0);
  if (received <= 0) return null;

  const sentOut = (tx.tokenTransfers ?? [])
    .filter((t) => t.mint === TOKEN.mint && t.fromUserAccount === wallet)
    .reduce((s, t) => s + (t.tokenAmount || 0), 0);
  const netWazzup = received - sentOut;
  if (netWazzup <= 0) return null;

  const swap = tx.events?.swap;
  let solSpent = 0;
  if (swap?.nativeInput?.account === wallet && swap.nativeInput?.amount) {
    solSpent = Number(BigInt(swap.nativeInput.amount)) / 1_000_000_000;
  }

  return {
    signature: tx.signature,
    timestamp: tx.timestamp,
    wallet,
    walletLabel: BUYBACK_WALLETS.find((w) => w.address === wallet)?.label ?? wallet,
    wazzupReceived: netWazzup,
    solSpent,
  };
}

async function fetchWalletBuybacks(wallet: string, sinceUnix: number): Promise<BuybackEvent[]> {
  const events: BuybackEvent[] = [];
  let before: string | undefined;
  for (let page = 0; page < 10; page++) {
    const txs = await getAddressTransactions(wallet, { limit: 100, before, type: "SWAP" });
    if (txs.length === 0) break;
    for (const tx of txs) {
      if (tx.timestamp < sinceUnix) return events;
      const e = extractBuyback(tx, wallet);
      if (e) events.push(e);
    }
    before = txs[txs.length - 1]?.signature;
    if (txs.length < 100) break;
  }
  return events;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const windowDays = Math.max(1, Math.min(365, Number(url.searchParams.get("days") ?? 7)));
    const sinceUnix = Math.floor(Date.now() / 1000) - windowDays * 86_400;
    const cacheKey = `buybacks:${windowDays}`;

    const payload = await cached<BuybacksPayload>(cacheKey, 120_000, async () => {
      const perWallet = await Promise.all(
        BUYBACK_WALLETS.map((w) => fetchWalletBuybacks(w.address, sinceUnix)),
      );
      const events = perWallet.flat().sort((a, b) => b.timestamp - a.timestamp);

      const byWallet: BuybacksPayload["totals"]["byWallet"] = {};
      for (const w of BUYBACK_WALLETS) byWallet[w.label] = { wazzupBought: 0, solSpent: 0, count: 0 };
      const dailyMap = new Map<string, { wazzup: number; sol: number }>();

      for (const e of events) {
        const b = byWallet[e.walletLabel];
        if (b) {
          b.wazzupBought += e.wazzupReceived;
          b.solSpent += e.solSpent;
          b.count += 1;
        }
        const date = new Date(e.timestamp * 1000).toISOString().slice(0, 10);
        const d = dailyMap.get(date) ?? { wazzup: 0, sol: 0 };
        d.wazzup += e.wazzupReceived;
        d.sol += e.solSpent;
        dailyMap.set(date, d);
      }

      const daily: BuybacksPayload["totals"]["daily"] = [];
      for (let i = windowDays - 1; i >= 0; i--) {
        const date = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
        const d = dailyMap.get(date) ?? { wazzup: 0, sol: 0 };
        daily.push({ date, ...d });
      }

      return {
        windowDays,
        events: events.slice(0, 50),
        totals: {
          wazzupBought: events.reduce((s, e) => s + e.wazzupReceived, 0),
          solSpent: events.reduce((s, e) => s + e.solSpent, 0),
          byWallet,
          daily,
        },
        updatedAt: Date.now(),
      };
    });

    return NextResponse.json(payload, {
      headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
