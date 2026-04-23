import type { DashboardPayload } from "@/app/api/dashboard/route";
import { WalletCard } from "./WalletCard";

export function HoldingsGrid({ wallets }: { wallets: DashboardPayload["wallets"] }) {
  const operating = wallets
    .filter((w) => w.role !== "locked")
    .sort((a, b) => b.balance - a.balance);
  const locked = wallets
    .filter((w) => w.role === "locked")
    .sort((a, b) => b.balance - a.balance);
  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <h2 className="pixel-font text-xs text-muted">Operating Wallets</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {operating.map((w) => (
            <WalletCard key={w.address} w={w} />
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <h2 className="pixel-font text-xs text-muted">Locked Vaults</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {locked.map((w) => (
            <WalletCard key={w.address} w={w} />
          ))}
        </div>
      </div>
    </section>
  );
}
