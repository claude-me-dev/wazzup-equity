import { NextResponse } from "next/server";
import { LOCKED_WALLETS } from "@/lib/config";
import { getManyWalletBalances, getMintSupply } from "@/lib/helius";
import { cached } from "@/lib/cache";

export const runtime = "nodejs";
export const revalidate = 60;

export async function GET() {
  try {
    const circulatingSupply = await cached("circulating-supply", 60_000, async () => {
      const [supply, lockedBalances] = await Promise.all([
        getMintSupply(),
        getManyWalletBalances(LOCKED_WALLETS.map((w) => w.address)),
      ]);
      const lockedTotal = Object.values(lockedBalances).reduce((a, b) => a + b, 0);
      return supply.ui - lockedTotal;
    });
    return NextResponse.json(
      { circulatingSupply },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
