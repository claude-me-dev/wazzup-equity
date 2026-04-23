import { formatTokenAmount } from "@/lib/format";
import type { DashboardPayload } from "@/app/api/dashboard/route";

export function SupplyHeader({ supply }: { supply: DashboardPayload["supply"] }) {
  const stats = [
    { label: "Total Supply", value: supply.total, sub: "On-chain mint (reflects burns)" },
    { label: "Circulating Supply", value: supply.circulating, sub: "Excl. locked vaults — used by Jupiter" },
    { label: "Locked", value: supply.lockedTotal, sub: `${supply.lockedPct.toFixed(2)}% of total` },
  ];
  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border border border-border rounded-lg overflow-hidden">
      {stats.map((s) => (
        <div key={s.label} className="bg-surface px-6 py-8 flex flex-col gap-2">
          <div className="pixel-font text-xs text-muted">{s.label}</div>
          <div className="mono-num text-3xl md:text-4xl font-semibold text-foreground">
            {formatTokenAmount(s.value)}
          </div>
          <div className="text-xs text-muted">{s.sub}</div>
        </div>
      ))}
    </section>
  );
}
