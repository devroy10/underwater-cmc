"use client";

import { useDeferredValue, useMemo, useState } from "react";
import type { SlimAsset } from "@/lib/types";
import { computePortfolio, type Holding } from "@/lib/underwater";
import { pct, signedPct, usd, underwaterColor } from "@/lib/format";
import { HBar } from "./charts";
import { useSelection } from "./selection";

const PRESET = `BTC 5000
ETH 3000
SOL 2000
DOGE 1200
LINK 1000
ARB 900
ONDO 800
PEPE 600`;

function parseHoldings(text: string): Holding[] {
  const out: Holding[] = [];
  for (const line of text.split("\n")) {
    const match = /^\s*([A-Za-z0-9$]+)\s*[,:=\s]\s*([\d.]+)\s*$/.exec(line);
    if (!match || !match[1] || !match[2]) continue;
    const value = Number(match[2]);
    if (!Number.isFinite(value) || value <= 0) continue;
    out.push({ symbol: match[1], value });
  }
  return out;
}

export function PortfolioPanel({ assets }: { assets: SlimAsset[] }) {
  const { select } = useSelection();
  const [text, setText] = useState(PRESET);
  const deferred = useDeferredValue(text);
  const holdings = useMemo(() => parseHoldings(deferred), [deferred]);
  const result = useMemo(() => computePortfolio(assets, holdings), [assets, holdings]);

  const risky = result.underwater > 0.5;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm leading-relaxed text-muted">
        Enter a portfolio as <span className="tabular text-ink">SYMBOL value</span> per line. We weight each
        asset&apos;s cost-basis position by its share of your book.
      </p>

      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        spellCheck={false}
        rows={9}
        className="w-full resize-y rounded-lg border border-line bg-panel-2/60 p-3 font-mono text-sm text-ink outline-none focus:border-line-strong"
      />

      {result.unknown.length > 0 ? (
        <p className="text-xs text-warn">Not in universe: {result.unknown.join(", ")}</p>
      ) : null}

      <div className="rounded-xl border border-line bg-panel-2/50 p-4">
        <div className="text-[11px] uppercase tracking-wider text-faint">Portfolio underwater supply</div>
        <div className="mt-1 flex items-baseline gap-3">
          <span className="tabular text-4xl font-semibold" style={{ color: underwaterColor(result.underwater) }}>
            {pct(result.underwater)}
          </span>
          <span className="text-sm text-muted">
            of {usd(result.totalValue)} · {signedPct(result.priceVsVwap, 1)} vs cost basis
          </span>
        </div>
        <div className="mt-3">
          <HBar value={result.underwater} color={risky ? "#f43f5e" : "#38bdf8"} height={8} />
        </div>
      </div>

      {result.matched.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {result.matched.map(({ asset, weight }) => (
            <li key={asset.symbol}>
              <button
                onClick={() => select(asset.id)}
                className="flex w-full items-center justify-between gap-3 rounded-md px-1 py-1 text-left text-sm hover:bg-panel-2"
              >
                <span className="w-14 font-medium text-ink">{asset.symbol}</span>
                <span className="w-10 text-right text-xs text-muted">{pct(weight)}</span>
                <div className="flex-1">
                  <HBar value={asset.underwater} color={underwaterColor(asset.underwater)} height={6} />
                </div>
                <span className="tabular w-10 text-right text-xs text-muted">{pct(asset.underwater)}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
