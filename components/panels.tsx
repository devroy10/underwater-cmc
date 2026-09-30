"use client";

import type { MarketPoint, SectorSummary, SlimAsset } from "@/lib/types";
import { SECTOR_COLORS, pct, signedPct } from "@/lib/format";
import { cn } from "@/lib/utils";
import { HBar } from "./charts";
import { TokenLogo } from "@/components/dashboard/token-logo";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAssetSelection } from "@/lib/dashboard/state";

/* ------------------------------------------------------------------ *
 * Stat tile
 * ------------------------------------------------------------------ */

export function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "underwater" | "profit";
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div
        className={cn(
          "tabular mt-1.5 text-2xl font-semibold",
          tone === "underwater" && "text-underwater",
          tone === "profit" && "text-profit",
          !tone && "text-foreground",
        )}
      >
        {value}
      </div>
      {sub ? <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Sector breakdown
 * ------------------------------------------------------------------ */

export function SectorBars({ sectors }: { sectors: SectorSummary[] }) {
  const max = Math.max(...sectors.map((s) => s.marketCap), 1);
  return (
    <ul className="flex flex-col gap-3">
      {sectors.map((s) => (
        <li key={s.sector} className="grid grid-cols-[130px_1fr_46px] items-center gap-3">
          <span className="flex items-center gap-2 text-xs text-foreground">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: SECTOR_COLORS[s.sector] }} />
            <span className="truncate" title={s.sector}>
              {s.sector}
            </span>
          </span>
          <span className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
            <span
              className="absolute inset-y-0 left-0 rounded-full"
              style={{ width: `${(s.marketCap / max) * 100}%`, background: SECTOR_COLORS[s.sector] }}
            />
          </span>
          <span className="tabular text-right text-xs text-muted-foreground">{pct(s.underwater)}</span>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ *
 * Leaderboards
 * ------------------------------------------------------------------ */

export function Leaderboards({ assets }: { assets: SlimAsset[] }) {
  const { selectedId, select } = useAssetSelection();
  const eligible = assets.filter((a) => !a.isStable && a.marketCap > 2e8);
  const trapped = [...eligible].sort((a, b) => b.underwater - a.underwater).slice(0, 8);
  const clean = [...eligible].sort((a, b) => a.underwater - b.underwater).slice(0, 8);

  return (
    <Tabs defaultValue="trapped" className="gap-3">
      <TabsList className="w-full">
        <TabsTrigger value="trapped">Most trapped</TabsTrigger>
        <TabsTrigger value="clean">Clean air</TabsTrigger>
      </TabsList>
      <TabsContent value="trapped">
        <LeaderboardList
          rows={trapped}
          selectedId={selectedId}
          onSelect={select}
          tone="underwater"
        />
      </TabsContent>
      <TabsContent value="clean">
        <LeaderboardList rows={clean} selectedId={selectedId} onSelect={select} tone="profit" />
      </TabsContent>
    </Tabs>
  );
}

function LeaderboardList({
  rows,
  selectedId,
  onSelect,
  tone,
}: {
  rows: SlimAsset[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  tone: "underwater" | "profit";
}) {
  return (
    <ul className="flex flex-col">
      {rows.map((a) => (
        <li key={a.id}>
          <button
            onClick={() => onSelect(a.id)}
            className={cn(
              "flex w-full items-center gap-3 border-b border-dashed px-2 py-2.5 text-left text-sm transition-colors last:border-0 hover:bg-muted",
              selectedId === a.id && "bg-muted",
            )}
          >
            <span className="tabular w-5 text-right text-xs text-muted-foreground">#{a.rank}</span>
            <TokenLogo id={a.id} symbol={a.symbol} size={20} />
            <span className="flex flex-1 items-baseline gap-2">
              <span className="font-medium text-foreground">{a.symbol}</span>
              <span className="tabular text-[11px] text-muted-foreground">
                {signedPct(a.priceVsVwap, 0)}
              </span>
            </span>
            <span className="hidden w-20 sm:block">
              <HBar
                value={a.underwater}
                color={tone === "underwater" ? "var(--underwater)" : "var(--profit)"}
                height={6}
              />
            </span>
            <span
              className={cn(
                "tabular w-9 text-right text-xs font-medium",
                tone === "underwater" ? "text-underwater" : "text-profit",
              )}
            >
              {pct(a.underwater)}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ *
 * Methodology
 * ------------------------------------------------------------------ */

export function Methodology({ series, generatedAt }: { series: MarketPoint[]; generatedAt: string }) {
  const first = series[0];
  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <section className="lg:col-span-2">
        <h2 className="text-lg font-semibold">Methodology</h2>
        <div className="mt-3 flex flex-col gap-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            Price tells you what an asset is worth. It does not tell you what the people holding it
            paid. We reconstruct an aggregate <span className="text-foreground">cost basis</span> from
            one year of daily price and volume, then measure how much of that traded supply sits at a
            loss.
          </p>
          <div className="rounded-lg border bg-muted/40 p-4 font-mono text-xs text-foreground">
            <div>cost basis = Σ(priceᵢ · volumeᵢ) / Σ(volumeᵢ)</div>
            <div className="mt-1">underwater = Σ volumeᵢ [priceᵢ &gt; price_now] / Σ volumeᵢ</div>
          </div>
          <p>
            CoinMarketCap exposes price and 24h volume but not realised cost basis, so VWAP over the
            trailing window is used as the proxy for the market&apos;s aggregate entry price. A coin is{" "}
            <span className="text-foreground">underwater</span> when most of the volume that traded in
            the last year changed hands above today&apos;s price. The marginal holder is holding a loss.
          </p>
          <p>
            Stablecoins are excluded and assets with fewer than 120 daily observations are dropped.
            {first ? ` The market series begins ${first.t}.` : ""} Snapshot assembled{" "}
            {new Date(generatedAt).toLocaleString("en-US", { timeZone: "UTC" })}.
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Endpoints used</h2>
        <ul className="mt-3 flex flex-col gap-2 text-sm">
          {[
            ["/v1/cryptocurrency/listings/latest", "universe, tags to sectors, volume"],
            ["/v1/cryptocurrency/quotes/historical", "365 daily price + volume points"],
            ["/v3/fear-and-greed/historical", "sentiment overlay"],
            ["/v1/global-metrics/quotes/latest", "market-wide context"],
          ].map(([path, note]) => (
            <li key={path} className="rounded-lg border bg-muted/40 p-3">
              <code className="font-mono text-xs text-profit">{path}</code>
              <div className="mt-0.5 text-xs text-muted-foreground">{note}</div>
            </li>
          ))}
        </ul>
        <div className="mt-4 rounded-lg border border-catalyst/40 bg-catalyst/10 p-3 text-xs leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground">Where the API got in the way:</span> history
          is capped at 12 months, quotes/historical is billed per row, and there is no field for
          realised entry price, so VWAP is a proxy.
        </div>
      </section>
    </div>
  );
}
