"use client";

import type { MarketPoint, SectorSummary, SlimAsset } from "@/lib/types";
import { SECTOR_COLORS, pct, signedPct } from "@/lib/format";
import { HBar } from "./charts";
import { useSelection } from "./selection";

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
  tone?: "trapped" | "clean";
}) {
  const color = tone === "trapped" ? "text-trapped" : tone === "clean" ? "text-clean" : "text-ink";
  return (
    <div className="rounded-xl border border-line bg-panel-2/40 p-3.5">
      <div className="text-[11px] uppercase tracking-wider text-faint">{label}</div>
      <div className={`tabular mt-1.5 text-2xl font-semibold ${color}`}>{value}</div>
      {sub ? <div className="mt-0.5 text-xs text-muted">{sub}</div> : null}
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
          <span className="flex items-center gap-2 text-xs text-ink">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: SECTOR_COLORS[s.sector] }} />
            <span className="truncate" title={s.sector}>
              {s.sector}
            </span>
          </span>
          <span className="relative h-2 w-full overflow-hidden rounded-full bg-white/5">
            <span
              className="absolute inset-y-0 left-0 rounded-full"
              style={{ width: `${(s.marketCap / max) * 100}%`, background: SECTOR_COLORS[s.sector] }}
            />
          </span>
          <span className="tabular text-right text-xs text-muted" title="trailing-window underwater share">
            {pct(s.underwater)}
          </span>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ *
 * Leaderboards
 * ------------------------------------------------------------------ */

export function Leaderboards({ assets }: { assets: SlimAsset[] }) {
  const { selectedId, select } = useSelection();
  const eligible = assets.filter((a) => !a.isStable && a.marketCap > 2e8);
  const trapped = [...eligible].sort((a, b) => b.underwater - a.underwater).slice(0, 7);
  const clean = [...eligible].sort((a, b) => a.underwater - b.underwater).slice(0, 7);

  return (
    <div className="grid grid-cols-2 gap-5">
      <Column
        title="Most trapped"
        hint="largest caps holding the most underwater supply"
        rows={trapped}
        selectedId={selectedId}
        onSelect={select}
        tone="trapped"
      />
      <Column
        title="Cleanest air"
        hint="trading above almost all of the year's cost basis"
        rows={clean}
        selectedId={selectedId}
        onSelect={select}
        tone="clean"
      />
    </div>
  );
}

function Column({
  title,
  hint,
  rows,
  selectedId,
  onSelect,
  tone,
}: {
  title: string;
  hint: string;
  rows: SlimAsset[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  tone: "trapped" | "clean";
}) {
  return (
    <div>
      <div className={`text-xs font-semibold uppercase tracking-wider ${tone === "trapped" ? "text-trapped" : "text-clean"}`}>
        {title}
      </div>
      <div className="mb-2 text-[11px] leading-snug text-faint">{hint}</div>
      <ul className="flex flex-col gap-1">
        {rows.map((a) => (
          <li key={a.id}>
            <button
              onClick={() => onSelect(a.id)}
              className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-panel-2 ${
                selectedId === a.id ? "bg-panel-2" : ""
              }`}
            >
              <span className="flex items-baseline gap-2">
                <span className="font-medium text-ink">{a.symbol}</span>
                <span className="tabular text-[11px] text-muted">{signedPct(a.priceVsVwap, 0)}</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="hidden w-16 sm:block">
                  <HBar value={a.underwater} color={tone === "trapped" ? "#f43f5e" : "#38bdf8"} height={5} />
                </span>
                <span className="tabular w-8 text-right text-xs text-ink">{pct(a.underwater)}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Methodology + endpoints + feedback
 * ------------------------------------------------------------------ */

export function Methodology({ series, generatedAt }: { series: MarketPoint[]; generatedAt: string }) {
  const first = series[0];
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <section className="lg:col-span-2">
        <h2 className="text-lg font-semibold">Methodology</h2>
        <div className="mt-3 flex flex-col gap-3 text-sm leading-relaxed text-muted">
          <p>
            Price tells you what an asset is worth. It does not tell you what the people holding it paid. We
            reconstruct an aggregate <span className="text-ink">cost basis</span> from one year of daily
            price × volume and measure how much of that traded supply now sits at a loss.
          </p>
          <div className="rounded-lg border border-line bg-panel-2/50 p-4 font-mono text-xs text-ink">
            <div>cost basis = Σ(priceᵢ · volumeᵢ) / Σ(volumeᵢ)</div>
            <div className="mt-1">underwater = Σ volumeᵢ [priceᵢ &gt; price_now] / Σ volumeᵢ</div>
          </div>
          <p>
            Because CoinMarketCap exposes price and 24h volume but not realised cost basis, VWAP over the
            trailing window is used as the standard proxy for the market&apos;s aggregate entry price. A coin is{" "}
            <span className="text-ink">underwater</span> when most of the volume that traded in the last year
            changed hands above today&apos;s price — i.e. the marginal holder is holding a loss.
          </p>
          <p>
            The headline figure is volume-weighted across {series.length > 0 ? "the tracked universe" : "the universe"}.
            Stablecoins are excluded (their peg makes the metric meaningless) and assets with fewer than 120
            daily observations are dropped.
          </p>
          {first ? (
            <p className="text-xs text-faint">
              Market series begins {first.t}. Snapshot assembled {new Date(generatedAt).toLocaleString("en-US")}.
            </p>
          ) : null}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Endpoints used</h2>
        <ul className="mt-3 flex flex-col gap-2 text-sm">
          {[
            ["/v1/cryptocurrency/listings/latest", "universe, tags → sectors, volume"],
            ["/v1/cryptocurrency/quotes/historical", "365 daily price + volume points"],
            ["/v3/fear-and-greed/historical", "sentiment overlay"],
            ["/v1/global-metrics/quotes/latest", "market-wide context"],
          ].map(([path, note]) => (
            <li key={path} className="rounded-lg border border-line bg-panel-2/40 p-3">
              <code className="font-mono text-xs text-clean">{path}</code>
              <div className="mt-0.5 text-xs text-muted">{note}</div>
            </li>
          ))}
        </ul>
        <div className="mt-4 rounded-lg border border-warn/30 bg-warn/5 p-3 text-xs leading-relaxed text-muted">
          <span className="font-semibold text-warn">Where the API got in the way:</span> the plan caps history at
          12 months, so a true multi-cycle cost basis needs a higher tier; `quotes/historical` charges per
          returned row, which makes a full 10k-asset universe expensive; and there is no field for realised
          entry price or holder cohorts, so VWAP is a proxy rather than ground truth.
        </div>
      </section>
    </div>
  );
}
