import { ExternalLink, Lock } from "lucide-react";
import { formatTokenAmount, shortAddress } from "@/lib/format";
import type { DashboardPayload } from "@/app/api/dashboard/route";

export function WalletCard({ w }: { w: DashboardPayload["wallets"][number] }) {
  const isLocked = w.role === "locked";
  return (
    <a
      href={`https://solscan.io/account/${w.address}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group bg-surface border border-border rounded-lg px-5 py-5 flex flex-col gap-3 hover:border-foreground transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5 min-w-0">
          <div className="flex items-center gap-2">
            {isLocked && <Lock className="h-3.5 w-3.5 text-muted shrink-0" />}
            <span className="pixel-font text-xs text-foreground truncate">{w.label}</span>
          </div>
          <span className="text-xs text-muted truncate">{w.sns || shortAddress(w.address)}</span>
        </div>
        <ExternalLink className="h-3.5 w-3.5 text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      </div>
      <div className="flex items-baseline gap-2">
        <span className="mono-num text-2xl font-semibold tracking-tight">
          {formatTokenAmount(w.balance, { compact: true })}
        </span>
        <span className="mono-num text-xs text-muted">{w.pctOfTotal.toFixed(2)}%</span>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {w.isBuybackSource && (
          <span className="text-[10px] uppercase tracking-wider bg-foreground text-background px-1.5 py-0.5 rounded">
            Buyback source
          </span>
        )}
        {w.locked && (
          <span className="text-[10px] uppercase tracking-wider border border-border text-muted px-1.5 py-0.5 rounded">
            Locked · {w.locked.days.toLocaleString()}d
          </span>
        )}
      </div>
    </a>
  );
}
