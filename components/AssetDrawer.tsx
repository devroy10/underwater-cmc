"use client";

import { useEffect, useState } from "react";
import type { AssetDetail } from "@/lib/types";
import { SECTOR_COLORS, pct, signedPct, underwaterColor, usdExact } from "@/lib/format";
import { Sparkline, VolumeProfile } from "./charts";
import { useSelection } from "./selection";

export function AssetDrawer() {
  const { selectedId, select } = useSelection();
  const [detail, setDetail] = useState<AssetDetail | null>(null);
  const [errorId, setErrorId] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (selectedId === null) return;
    const controller = new AbortController();
    fetch(`/api/asset?id=${selectedId}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return (await res.json()) as AssetDetail;
      })
      .then((data) => setDetail(data))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setErrorId(selectedId);
      });
    return () => controller.abort();
  }, [selectedId]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") select(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [select]);

  if (selectedId === null) return null;

  // Ignore a stale payload from a previously selected asset.
  const asset = detail && detail.asset.id === selectedId ? detail.asset : undefined;
  const loading = asset === undefined && errorId !== selectedId;
  const errored = errorId === selectedId;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        aria-label="Close"
        className="absolute inset-0 bg-abyss/70 backdrop-blur-sm"
        onClick={() => select(null)}
      />
      <aside className="relative h-full w-full max-w-[440px] overflow-y-auto border-l border-line bg-panel p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ background: asset ? SECTOR_COLORS[asset.sector] : "#7f95a9" }}
              />
              <h2 className="text-2xl font-semibold">{asset?.symbol ?? "…"}</h2>
            </div>
            <p className="text-sm text-muted">{asset?.name ?? "Loading"}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                if (!asset) return;
                try {
                  await navigator.clipboard.writeText(`${window.location.origin}/?asset=${asset.symbol}`);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                } catch {
                  /* clipboard unavailable */
                }
              }}
              className="rounded-md border border-line px-2 py-1 text-xs text-muted hover:text-ink"
            >
              {copied ? "Copied" : "Copy link"}
            </button>
            <button
              onClick={() => select(null)}
              className="rounded-md border border-line px-2 py-1 text-xs text-muted hover:text-ink"
            >
              Esc
            </button>
          </div>
        </div>

        {loading ? <p className="mt-8 text-sm text-muted">Loading asset…</p> : null}
        {errored ? <p className="mt-8 text-sm text-trapped">Could not load asset.</p> : null}

        {asset ? (
          <div className="mt-6 flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Underwater" value={pct(asset.underwater)} tone="trapped" />
              <Stat label="vs cost basis" value={signedPct(asset.priceVsVwap, 1)} />
              <Stat label="Trailing cost basis" value={usdExact(asset.vwap)} />
              <Stat label="Price" value={usdExact(asset.price)} />
              <Stat label="Pain depth" value={pct(asset.painDepth, 1)} />
              <Stat label="Rank" value={`#${asset.rank}`} />
            </div>

            <p className="rounded-lg border border-line bg-panel-2/60 p-3 text-sm leading-relaxed text-muted">
              {pct(asset.underwater)} of the last year&apos;s traded volume changed hands above{" "}
              <span className="tabular text-ink">{usdExact(asset.price)}</span> — buyers holding an average
              loss of <span className="tabular text-ink">{pct(asset.painDepth, 1)}</span>.
            </p>

            <section>
              <h3 className="mb-2 text-xs uppercase tracking-wider text-faint">Price vs cost basis (12m)</h3>
              <Sparkline price={asset.priceSeries} vwap={asset.vwapSeries} color={underwaterColor(asset.underwater)} />
              <p className="mt-1 text-[11px] text-faint">
                solid = price · dashed = running volume-weighted cost basis
              </p>
            </section>

            <section>
              <h3 className="mb-2 text-xs uppercase tracking-wider text-faint">Where the volume traded</h3>
              <VolumeProfile buckets={asset.profile} price={asset.price} vwap={asset.vwap} />
            </section>

            {detail && asset && detail.peer.length > 0 ? (
              <section>
                <h3 className="mb-2 text-xs uppercase tracking-wider text-faint">
                  Same sector · {asset.sector}
                </h3>
                <ul className="flex flex-col gap-1.5">
                  {detail.peer.map((peer) => (
                    <li key={peer.id}>
                      <button
                        onClick={() => select(peer.id)}
                        className="flex w-full items-center justify-between rounded-md border border-transparent px-2 py-1.5 text-sm hover:border-line hover:bg-panel-2"
                      >
                        <span className="text-ink">{peer.symbol}</span>
                        <span className="tabular text-muted">{pct(peer.underwater)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        ) : null}
      </aside>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "trapped" }) {
  return (
    <div className="rounded-lg border border-line bg-panel-2/50 p-3">
      <div className="text-[11px] uppercase tracking-wider text-faint">{label}</div>
      <div className={`tabular mt-1 text-lg ${tone === "trapped" ? "text-trapped" : "text-ink"}`}>{value}</div>
    </div>
  );
}
