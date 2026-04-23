"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatTokenAmount, shortAddress } from "@/lib/format";
import type { BuybacksPayload } from "@/app/api/buybacks/route";

const WINDOWS = [
  { days: 7, label: "7D" },
  { days: 30, label: "30D" },
  { days: 90, label: "90D" },
];

export function BuybackChart() {
  const [windowDays, setWindowDays] = useState(7);
  const [data, setData] = useState<BuybacksPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/buybacks?days=${windowDays}`)
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        if (j.error) setError(j.error);
        else setData(j as BuybacksPayload);
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [windowDays]);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div className="flex flex-col gap-1">
          <h2 className="pixel-font text-xs text-muted">Buybacks</h2>
          <p className="text-sm text-muted">
            WAZZUP acquired by the deployer, treasury, and liquidity wallets via swaps.
          </p>
        </div>
        <div className="flex gap-1 bg-surface border border-border rounded-md p-1">
          {WINDOWS.map((w) => (
            <button
              key={w.days}
              onClick={() => setWindowDays(w.days)}
              className={`pixel-font text-[10px] px-3 py-1.5 rounded transition-colors ${
                windowDays === w.days
                  ? "bg-foreground text-background"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {w.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-surface border border-border rounded-lg p-6 flex flex-col gap-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat label="WAZZUP Bought" value={formatTokenAmount(data?.totals.wazzupBought ?? 0, { compact: true })} />
          <Stat label="SOL Spent" value={(data?.totals.solSpent ?? 0).toFixed(4)} />
          <Stat label="Events" value={(data?.events.length ?? 0).toString()} />
          <Stat label="Window" value={`${windowDays}d`} />
        </div>

        <div className="h-[260px] w-full">
          {loading && <div className="h-full flex items-center justify-center text-sm text-muted">Loading…</div>}
          {error && <div className="h-full flex items-center justify-center text-sm text-red-600">{error}</div>}
          {!loading && !error && data && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.totals.daily} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#e5e5e0" strokeDasharray="2 4" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#6b6b6b", fontSize: 10 }}
                  tickFormatter={(d: string) => d.slice(5)}
                  stroke="#e5e5e0"
                />
                <YAxis
                  tick={{ fill: "#6b6b6b", fontSize: 10 }}
                  tickFormatter={(v: number) => formatTokenAmount(v, { compact: true })}
                  stroke="#e5e5e0"
                  width={48}
                />
                <Tooltip
                  cursor={{ fill: "rgba(0,0,0,0.04)" }}
                  contentStyle={{
                    background: "#ffffff",
                    border: "1px solid #e5e5e0",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v: number) => [formatTokenAmount(v), "WAZZUP"]}
                />
                <Bar dataKey="wazzup" radius={[2, 2, 0, 0]} minPointSize={2}>
                  {data.totals.daily.map((d, i) => (
                    <Cell key={i} fill={d.wazzup > 0 ? "#0a0a0a" : "#e5e5e0"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {data && data.events.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="pixel-font text-xs text-muted">Recent Events</div>
            <div className="flex flex-col divide-y divide-border">
              {data.events.slice(0, 8).map((e) => (
                <a
                  key={e.signature}
                  href={`https://solscan.io/tx/${e.signature}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center py-2 text-sm hover:bg-background/60 -mx-2 px-2 rounded"
                >
                  <span className="pixel-font text-[10px] text-muted">{e.walletLabel}</span>
                  <span className="mono-num text-xs text-muted">
                    {new Date(e.timestamp * 1000).toLocaleString()}
                  </span>
                  <span className="mono-num text-xs text-muted">{shortAddress(e.signature)}</span>
                  <span className="mono-num font-medium text-right">
                    +{formatTokenAmount(e.wazzupReceived, { compact: true })}
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="pixel-font text-[10px] text-muted">{label}</div>
      <div className="mono-num text-lg font-semibold">{value}</div>
    </div>
  );
}
