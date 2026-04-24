import { LOCKED_WALLETS, TOKEN, WALLETS } from "./config";
import { getManyWalletBalances, getMintSupply } from "./helius";
import { cached } from "./cache";

export interface DashboardPayload {
  token: { symbol: string; mint: string; decimals: number };
  supply: {
    total: number;
    circulating: number;
    lockedTotal: number;
    lockedPct: number;
  };
  wallets: Array<{
    address: string;
    label: string;
    sns: string;
    role: string;
    balance: number;
    pctOfTotal: number;
    locked?: { days: number };
    isBuybackSource?: boolean;
  }>;
  updatedAt: number;
}

export function getDashboardPayload(): Promise<DashboardPayload> {
  return cached<DashboardPayload>("dashboard", 20_000, async () => {
    const [supply, balances] = await Promise.all([
      getMintSupply(),
      getManyWalletBalances(WALLETS.map((w) => w.address)),
    ]);
    const lockedTotal = LOCKED_WALLETS.reduce((s, w) => s + (balances[w.address] ?? 0), 0);
    const circulating = supply.ui - lockedTotal;
    return {
      token: { symbol: TOKEN.symbol, mint: TOKEN.mint, decimals: TOKEN.decimals },
      supply: {
        total: supply.ui,
        circulating,
        lockedTotal,
        lockedPct: supply.ui > 0 ? (lockedTotal / supply.ui) * 100 : 0,
      },
      wallets: WALLETS.map((w) => ({
        address: w.address,
        label: w.label,
        sns: w.sns,
        role: w.role,
        balance: balances[w.address] ?? 0,
        pctOfTotal: supply.ui > 0 ? ((balances[w.address] ?? 0) / supply.ui) * 100 : 0,
        locked: w.locked,
        isBuybackSource: w.isBuybackSource,
      })),
      updatedAt: Date.now(),
    };
  });
}
