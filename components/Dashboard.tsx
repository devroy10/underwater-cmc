"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { SlimDataset } from "@/lib/types";
import { pct, usd } from "@/lib/format";
import { CostBasisMap, MarketIndexChart } from "./charts";
import { Explorer } from "./Explorer";
import { PortfolioPanel } from "./PortfolioPanel";
import { AssetDrawer } from "./AssetDrawer";
import { Leaderboards, Methodology, SectorBars, Stat } from "./panels";
import { SelectionProvider } from "./selection";

export function Dashboard({ dataset }: { dataset: SlimDataset }) {
  const [data, setData] = useState<SlimDataset>(dataset);
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedSymbol = searchParams.get("asset");

  // Selection is URL-driven: `?asset=SYM` is shareable and survives refresh.
  const selectedId = useMemo(() => {
    if (!selectedSymbol) return null;
    const match = data.assets.find(
      (a) => a.symbol.toLowerCase() === selectedSymbol.toLowerCase(),
    );
    return match ? match.id : null;
  }, [selectedSymbol, data.assets]);

  const select = useCallback(
    (id: number | null) => {
      const symbol = id === null ? null : data.assets.find((a) => a.id === id)?.symbol ?? null;
      const query = symbol ? `?asset=${encodeURIComponent(symbol)}` : "?";
      router.replace(query, { scroll: false });
    },
    [data.assets, router],
  );

  const [refresh, setRefresh] = useState<{ state: "idle" | "loading" | "error"; message?: string }>({
    state: "idle",
  });
  const [ai, setAi] = useState<{ state: "idle" | "loading" | "error" | "done"; text: string }>({
    state: "idle",
    text: "",
  });

  const selection = useMemo(() => ({ selectedId, select }), [selectedId, select]);

  const refreshLive = useCallback(async () => {
    setRefresh({ state: "loading" });
    try {
      const res = await fetch("/api/refresh", { method: "POST" });
      const body: unknown = await res.json();
      if (!res.ok) {
        const message =
          body && typeof body === "object" && "error" in body
            ? String((body as { error: unknown }).error)
            : `HTTP ${res.status}`;
        setRefresh({ state: "error", message });
        return;
      }
      const next = (body as { dataset: SlimDataset }).dataset;
      setData(next);
      setRefresh({ state: "idle" });
    } catch (error) {
      setRefresh({ state: "error", message: error instanceof Error ? error.message : "network error" });
    }
  }, []);

  const askAnalyst = useCallback(async () => {
    setAi({ state: "loading", text: "" });
    const summary = {
      underwater: data.market.underwater,
      breadth: data.market.breadth,
      volume: data.market.volume,
      fng: data.market.fng,
      window: data.window,
      trapped: [...data.assets]
        .filter((a) => !a.isStable)
        .sort((a, b) => b.underwater - a.underwater)
        .slice(0, 5)
        .map((a) => ({ symbol: a.symbol, underwater: a.underwater, vsCostBasis: a.priceVsVwap })),
      clean: [...data.assets]
        .filter((a) => !a.isStable)
        .sort((a, b) => a.underwater - b.underwater)
        .slice(0, 5)
        .map((a) => ({ symbol: a.symbol, underwater: a.underwater, vsCostBasis: a.priceVsVwap })),
    };
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(summary),
      });
      const body: unknown = await res.json();
      if (!res.ok) {
        const message =
          body && typeof body === "object" && "error" in body
            ? String((body as { error: unknown }).error)
            : `HTTP ${res.status}`;
        setAi({ state: "error", text: message });
        return;
      }
      const text = (body as { text: string }).text;
      setAi({ state: "done", text });
    } catch (error) {
      setAi({ state: "error", text: error instanceof Error ? error.message : "network error" });
    }
  }, [data]);

  const { market } = data;

  return (
    <SelectionProvider value={selection}>
      <div className="mx-auto flex max-w-[1400px] flex-col gap-8 px-5 py-8">
        <Header
          asOf={data.asOf}
          source={data.source}
          warningCount={data.warnings.length}
          refresh={refresh}
          onRefresh={refreshLive}
        />

        <section className="grid gap-4 lg:grid-cols-3">
          <div className="panel p-5 lg:col-span-2">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
                Market underwater index · {data.window}
              </h2>
              <span className="text-xs text-faint">
                share of trailing traded volume below today&apos;s price
              </span>
            </div>
            <MarketIndexChart series={data.marketSeries} />
          </div>

          <div className="flex flex-col gap-4">
            <div className="panel p-5">
              <div className="text-[11px] uppercase tracking-wider text-faint">Market underwater supply</div>
              <div className="tabular mt-1 text-6xl font-semibold text-trapped">{pct(market.underwater)}</div>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                of <span className="tabular text-ink">{usd(market.volume)}</span> of traded volume in the last
                year changed hands <span className="text-ink">above today&apos;s price</span>.
              </p>
              <button
                onClick={askAnalyst}
                disabled={ai.state === "loading"}
                className="mt-4 w-full rounded-lg border border-line px-3 py-2 text-sm text-ink transition-colors hover:border-line-strong disabled:opacity-50"
              >
                {ai.state === "loading" ? "Reading the tape…" : "✦ Analyst read"}
              </button>
              {ai.state === "error" ? <p className="mt-2 text-xs text-warn">{ai.text}</p> : null}
              {ai.state === "done" ? (
                <p className="mt-3 text-sm leading-relaxed text-muted">{ai.text}</p>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Stat label="Universe breadth" value={pct(market.breadth)} sub="below cost basis" tone="trapped" />
              <Stat
                label="Fear & Greed"
                value={market.fng !== null ? String(Math.round(market.fng)) : "—"}
                sub={market.fngLabel ?? "unavailable"}
                tone={market.fng !== null && market.fng < 50 ? "clean" : undefined}
              />
              <Stat label="Assets" value={String(data.assets.length)} sub={`tracked · ${data.window}`} />
              <Stat
                label="Market cap"
                value={usd(data.context?.totalMarketCap ?? market.marketCap)}
                sub={data.context?.btcDominance ? `BTC.D ${data.context.btcDominance.toFixed(1)}%` : "tracked universe"}
              />
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <div className="panel p-5 lg:col-span-2">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
                The cost-basis map
              </h2>
              <span className="text-xs text-faint">click any asset</span>
            </div>
            <CostBasisMap assets={data.assets} selectedId={selectedId} onSelect={select} />
            <p className="mt-2 text-xs leading-relaxed text-faint">
              Up = more of the asset&apos;s year traded above its current price (trapped buyers). Right = price
              above its cost basis (holders in profit). Bubble size = market cap, colour = sector. The
              bottom-right corner is &ldquo;clean air&rdquo;; the top-left is a wall of holders waiting to break
              even.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="panel p-5">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">
                Where supply sits, by sector
              </h2>
              <SectorBars sectors={data.sectors} />
              <p className="mt-3 text-xs text-faint">bar = market cap · right = underwater share</p>
            </div>
            <div className="panel p-5">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">
                Leaderboards
              </h2>
              <Leaderboards assets={data.assets} />
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <div className="panel p-5 lg:col-span-2">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted">
              Asset explorer
            </h2>
            <Explorer assets={data.assets} />
          </div>
          <div className="panel p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">
              Your portfolio&apos;s cost basis
            </h2>
            <PortfolioPanel assets={data.assets} />
          </div>
        </section>

        <section className="panel p-6">
          <Methodology series={data.marketSeries} generatedAt={data.generatedAt} />
        </section>

        <Footer source={data.source} asOf={data.asOf} warnings={data.warnings} />
      </div>

      <AssetDrawer />
    </SelectionProvider>
  );
}

function Header({
  asOf,
  source,
  warningCount,
  refresh,
  onRefresh,
}: {
  asOf: string;
  source: "live" | "snapshot";
  warningCount: number;
  refresh: { state: "idle" | "loading" | "error"; message?: string };
  onRefresh: () => void;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="flex items-center gap-3">
          <Wave />
          <h1 className="text-3xl font-semibold tracking-tight">UNDERWATER</h1>
          <span
            className={`flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-[11px] uppercase tracking-wider ${
              source === "live" ? "text-good" : "text-muted"
            }`}
          >
            <span
              className={`inline-block h-1.5 w-1.5 rounded-full ${source === "live" ? "bg-good live-dot" : "bg-muted"}`}
            />
            {source}
          </span>
        </div>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          The market&apos;s hidden cost basis. Where is the supply that needs to be absorbed before price can
          travel? Built on the CoinMarketCap API.
        </p>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right text-xs text-faint">
          <div>as of {new Date(asOf).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
          {warningCount > 0 ? <div className="text-warn">{warningCount} warning(s)</div> : null}
        </div>
        <button
          onClick={onRefresh}
          disabled={refresh.state === "loading"}
          className="rounded-lg border border-line bg-panel-2/60 px-4 py-2 text-sm text-ink transition-colors hover:border-line-strong disabled:opacity-50"
          title="Pull a fresh 80-asset universe live from the CMC API"
        >
          {refresh.state === "loading" ? "Refreshing from CMC…" : "Refresh live"}
        </button>
      </div>
      {refresh.state === "error" ? (
        <p className="w-full text-right text-xs text-warn">{refresh.message}</p>
      ) : null}
    </header>
  );
}

function Wave() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden className="shrink-0">
      <defs>
        <linearGradient id="wave-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f43f5e" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
      </defs>
      <path d="M2 19c4-7 8-7 12 0s8 7 12 0" fill="none" stroke="url(#wave-g)" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M2 25c4-5 8-5 12 0s8 5 12 0" fill="none" stroke="#38bdf8" strokeOpacity="0.5" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function Footer({
  source,
  asOf,
  warnings,
}: {
  source: "live" | "snapshot";
  asOf: string;
  warnings: string[];
}) {
  return (
    <footer className="flex flex-col gap-2 border-t border-line pt-6 text-xs text-faint">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span>
          Data © CoinMarketCap · {source} snapshot {new Date(asOf).toISOString().slice(0, 10)} · not investment
          advice
        </span>
        <span className="tabular">#BuildwithCMC</span>
      </div>
      {warnings.length > 0 ? (
        <details>
          <summary className="cursor-pointer">Warnings ({warnings.length})</summary>
          <ul className="mt-2 list-disc pl-5">
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </details>
      ) : null}
    </footer>
  );
}
