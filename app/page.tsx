import { headers } from "next/headers";
import { ExternalLink } from "lucide-react";
import { HoldingsGrid } from "@/components/HoldingsGrid";
import { SupplyHeader } from "@/components/SupplyHeader";
import { TOKEN } from "@/lib/config";
import type { DashboardPayload } from "@/app/api/dashboard/route";

const X_URL = "https://x.com/WazzupEquity";
const SOLSCAN_TOKEN_URL = `https://solscan.io/token/${TOKEN.mint}`;

export const revalidate = 20;

async function getDashboard(): Promise<DashboardPayload | { error: string }> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  const res = await fetch(`${proto}://${host}/api/dashboard`, { next: { revalidate: 20 } });
  return res.json();
}

export default async function Home() {
  const data = await getDashboard();
  const hasError = "error" in data;

  return (
    <div className="flex-1 grid-bg">
      <div className="mx-auto max-w-6xl px-6 md:px-10 py-10 md:py-16 flex flex-col gap-12">
        <header className="flex flex-col gap-8">
          <div className="bg-surface border border-border rounded-lg px-6 md:px-12 py-12 md:py-16 flex flex-col items-center gap-6 text-center">
            <h1 className="pixel-font text-4xl sm:text-5xl md:text-7xl tracking-[0.12em] text-foreground leading-none">
              WAZZUP<br className="sm:hidden" />
              <span className="hidden sm:inline"> </span>EQUITY
            </h1>
            <p className="pixel-font text-sm md:text-base text-muted tracking-[0.2em]">
              Wazzup Dashboard
            </p>
            <div className="flex items-center gap-2 flex-wrap justify-center mt-2">
              <LinkPill href={X_URL} label="X">
                <XIcon className="h-3 w-3" />
              </LinkPill>
              <LinkPill href={SOLSCAN_TOKEN_URL} label="Solscan">
                <ExternalLink className="h-3 w-3" />
              </LinkPill>
            </div>
          </div>
          <div className="flex justify-end">
            <MintBadge />
          </div>
        </header>

        {hasError ? (
          <div className="bg-surface border border-border rounded-lg p-8 text-center">
            <div className="pixel-font text-xs text-muted mb-2">Unable to load on-chain data</div>
            <div className="mono-num text-xs text-red-600">{(data as { error: string }).error}</div>
            <div className="text-xs text-muted mt-4">
              Make sure <code className="mono-num bg-background px-1">HELIUS_API_KEY</code> is set in{" "}
              <code className="mono-num bg-background px-1">.env.local</code>.
            </div>
          </div>
        ) : (
          <>
            <SupplyHeader supply={data.supply} />
            <HoldingsGrid wallets={data.wallets} />
            <JupiterHint />
          </>
        )}

        <footer className="border-t border-border pt-6 flex flex-col gap-6">
          <div className="flex items-center justify-between text-xs text-muted flex-wrap gap-3">
            <span className="pixel-font">Wazzup Equity · Solana</span>
            <div className="flex items-center gap-4">
              <a
                href={X_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                X
              </a>
              <a
                href={SOLSCAN_TOKEN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                Solscan
              </a>
            </div>
          </div>
          <p className="text-[11px] leading-relaxed text-muted max-w-4xl">
            <span className="pixel-font text-foreground">Disclaimer.</span> Nothing on this page, or
            any page including Wazzup X and any other correspondence from Wazzup in any capacity is
            a solicitation to buy anything. No financial advice is being given. Do your own
            research.
          </p>
        </footer>
      </div>
    </div>
  );
}

function MintBadge() {
  return (
    <a
      href={SOLSCAN_TOKEN_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="group bg-surface border border-border rounded-lg px-4 py-3 flex flex-col gap-1 hover:border-foreground transition-colors"
      aria-label="Open mint on Solscan"
    >
      <div className="pixel-font text-[10px] text-muted">Mint</div>
      <div className="flex items-center gap-2">
        <code className="mono-num text-xs">{TOKEN.mint}</code>
        <ExternalLink className="h-3 w-3 text-muted group-hover:text-foreground transition-colors" />
      </div>
    </a>
  );
}

function LinkPill({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="pixel-font text-[11px] text-muted hover:text-foreground border border-border hover:border-foreground transition-colors px-3 py-1.5 rounded-full flex items-center gap-1.5"
    >
      {children}
      {label}
    </a>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
    </svg>
  );
}

function JupiterHint() {
  return (
    <section className="bg-surface border border-border rounded-lg p-6 flex flex-col gap-2">
      <div className="pixel-font text-xs text-muted">For Jupiter Verification</div>
      <p className="text-sm">
        Jupiter and other aggregators can read circulating supply from{" "}
        <code className="mono-num bg-background px-1 py-0.5 rounded border border-border">
          /api/circulating-supply
        </code>
        . Returns the live number, excluding both locked vaults.
      </p>
    </section>
  );
}
