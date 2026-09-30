"use client";

import { useDeferredValue, useMemo, useState } from "react";
import type { SlimAsset } from "@/lib/types";
import { computePortfolio, type Holding } from "@/lib/underwater";
import { pct, signedPct, usd, underwaterColor } from "@/lib/format";
import { useAssetSelection } from "@/lib/dashboard/state";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { HBar } from "./charts";

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
  const { select } = useAssetSelection();
  const [text, setText] = useState(PRESET);
  const deferred = useDeferredValue(text);
  const holdings = useMemo(() => parseHoldings(deferred), [deferred]);
  const result = useMemo(() => computePortfolio(assets, holdings), [assets, holdings]);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm leading-relaxed text-muted-foreground">
        Enter a portfolio as <span className="tabular text-foreground">SYMBOL value</span> per line. We
        weight each asset&apos;s cost-basis position by its share of your book.
      </p>

      <Textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        spellCheck={false}
        rows={9}
        className="font-mono"
        aria-label="Portfolio holdings"
      />

      {result.unknown.length > 0 ? (
        <p className="text-xs text-catalyst">Not in universe: {result.unknown.join(", ")}</p>
      ) : null}

      <div className="rounded-xl border bg-muted/40 p-4">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">
          Portfolio underwater supply
        </div>
        <div className="mt-1 flex flex-wrap items-baseline gap-3">
          <span
            className="tabular text-4xl font-semibold"
            style={{ color: underwaterColor(result.underwater) }}
          >
            {pct(result.underwater)}
          </span>
          <span className="text-sm text-muted-foreground">
            of {usd(result.totalValue)} · {signedPct(result.priceVsVwap, 1)} vs cost basis
          </span>
        </div>
        <div className="mt-3">
          <HBar
            value={result.underwater}
            color={result.underwater > 0.5 ? "var(--underwater)" : "var(--profit)"}
            height={8}
          />
        </div>
      </div>

      {result.matched.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {result.matched.map(({ asset, weight }) => (
            <li key={asset.symbol}>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 px-1"
                onClick={() => select(asset.id)}
              >
                <span className="w-14 text-left font-medium text-foreground">{asset.symbol}</span>
                <span className="w-10 text-right text-xs text-muted-foreground">{pct(weight)}</span>
                <span className="flex-1">
                  <HBar value={asset.underwater} color={underwaterColor(asset.underwater)} height={6} />
                </span>
                <span className="tabular w-10 text-right text-xs text-muted-foreground">
                  {pct(asset.underwater)}
                </span>
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
