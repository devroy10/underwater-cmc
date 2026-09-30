"use client";

/**
 * Hand-built SVG charts. No charting dependency: full control over craft and
 * clarity, and a small client bundle. Colors come from semantic tokens so the
 * charts follow the theme.
 */

import { useMemo, useState, type KeyboardEvent, type MouseEvent } from "react";
import type { ProfileBucket, SlimAsset } from "@/lib/types";
import {
  SECTOR_COLORS,
  pct,
  signedPct,
  usd,
} from "@/lib/format";

const GRID = "var(--border)";
const AXIS = "var(--muted-foreground)";
const UNDERWATER = "var(--underwater)";
const PROFIT = "var(--profit)";
const COST = "var(--cost)";
const INK = "var(--foreground)";

/* ------------------------------------------------------------------ *
 * Shared helpers
 * ------------------------------------------------------------------ */

/** Symmetric log transform so big % moves compress on both sides of zero. */
function symlog(v: number, k = 2): number {
  return Math.sign(v) * Math.log1p(Math.abs(v) * k);
}

function linePath(points: Array<[number, number]>): string {
  return points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(" ");
}

/** Round SVG coordinates so server and client serialize them identically. */
function r2(n: number): number {
  return Math.round(n * 100) / 100;
}

/* ------------------------------------------------------------------ *
 * Cost-basis map (scatter)
 * ------------------------------------------------------------------ */

const MAP_W = 1000;
const MAP_H = 620;
const MAP_PAD = { top: 28, right: 28, bottom: 44, left: 56 };

export function CostBasisMap({
  assets,
  selectedId,
  onSelect,
}: {
  assets: SlimAsset[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}) {
  const [hover, setHover] = useState<SlimAsset | null>(null);

  const plot = useMemo(() => {
    const innerW = MAP_W - MAP_PAD.left - MAP_PAD.right;
    const innerH = MAP_H - MAP_PAD.top - MAP_PAD.bottom;
    const maxMcap = Math.max(...assets.map((a) => a.marketCap), 1);
    const xMax = symlog(1.6);
    const xMin = symlog(-0.85);
    const x = (v: number) => r2(MAP_PAD.left + ((symlog(v) - xMin) / (xMax - xMin)) * innerW);
    const y = (v: number) => r2(MAP_PAD.top + (1 - Math.max(0, Math.min(1, v))) * innerH);
    const r = (mcap: number) => r2(3 + Math.sqrt(mcap / maxMcap) * 26);
    return assets.map((a) => ({ a, cx: x(a.priceVsVwap), cy: y(a.underwater), rr: r(a.marketCap) }));
  }, [assets]);

  function onMove(event: MouseEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const mx = ((event.clientX - rect.left) / rect.width) * MAP_W;
    const my = ((event.clientY - rect.top) / rect.height) * MAP_H;
    let best: SlimAsset | null = null;
    let bestDist = 28 * 28;
    for (const p of plot) {
      const d = (p.cx - mx) ** 2 + (p.cy - my) ** 2;
      const threshold = Math.max(bestDist, p.rr * p.rr);
      if (d < threshold) {
        best = p.a;
        bestDist = d;
      }
    }
    setHover(best);
  }

  const zeroX =
    MAP_PAD.left +
    ((symlog(0) - symlog(-0.85)) / (symlog(1.6) - symlog(-0.85))) *
      (MAP_W - MAP_PAD.left - MAP_PAD.right);
  const zeroXRounded = r2(zeroX);
  const xTicks = [-0.5, -0.25, 0, 0.25, 0.5, 1, 1.6];
  const hoverPos = hover ? plot.find((p) => p.a.id === hover.id) : null;

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${MAP_W} ${MAP_H}`}
        className="h-auto w-full select-none"
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      >
        <rect
          x={zeroXRounded}
          y={MAP_PAD.top}
          width={r2(MAP_W - MAP_PAD.right - zeroXRounded)}
          height={MAP_H - MAP_PAD.top - MAP_PAD.bottom}
          fill={PROFIT}
          fillOpacity="0.05"
        />
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const y = MAP_PAD.top + (1 - t) * (MAP_H - MAP_PAD.top - MAP_PAD.bottom);
          return (
            <g key={t}>
              <line x1={MAP_PAD.left} x2={MAP_W - MAP_PAD.right} y1={y} y2={y} stroke={GRID} />
              <text x={MAP_PAD.left - 12} y={y + 4} textAnchor="end" fontSize="12" fill={AXIS}>
                {Math.round(t * 100)}%
              </text>
            </g>
          );
        })}
        <line x1={zeroXRounded} x2={zeroXRounded} y1={MAP_PAD.top} y2={MAP_H - MAP_PAD.bottom} stroke={PROFIT} strokeOpacity="0.5" strokeDasharray="4 4" />
        {xTicks.map((v) => {
          const x =
            MAP_PAD.left +
            ((symlog(v) - symlog(-0.85)) / (symlog(1.6) - symlog(-0.85))) *
              (MAP_W - MAP_PAD.left - MAP_PAD.right);
          return (
            <text key={v} x={r2(x)} y={MAP_H - 12} textAnchor="middle" fontSize="12" fill={AXIS}>
              {v > 0 ? `+${Math.round(v * 100)}%` : `${Math.round(v * 100)}%`}
            </text>
          );
        })}

        {plot.map(({ a, cx, cy, rr }) => {
          const selected = a.id === selectedId;
          return (
            <circle
              key={a.id}
              cx={cx}
              cy={cy}
              r={rr}
              fill={SECTOR_COLORS[a.sector]}
              fillOpacity={selected || hover?.id === a.id ? 0.95 : 0.55}
              stroke={selected ? INK : "var(--card)"}
              strokeWidth={selected ? 2 : 1}
              className="cursor-pointer transition-[fill-opacity] focus:outline-none"
              role="button"
              tabIndex={0}
              aria-label={`${a.symbol}: ${pct(a.underwater)} of volume underwater`}
              onClick={() => onSelect(a.id)}
              onKeyDown={(event: KeyboardEvent<SVGCircleElement>) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelect(a.id);
                }
              }}
            />
          );
        })}

        <text x={MAP_PAD.left} y={22} fontSize="13" fill={AXIS}>
          Underwater = trapped buyers
        </text>
      </svg>

      {hover && hoverPos ? (
        <div
          className="pointer-events-none absolute z-10 w-56 rounded-lg border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md"
          style={{
            left: `${(hoverPos.cx / MAP_W) * 100}%`,
            top: `${(hoverPos.cy / MAP_H) * 100}%`,
            transform: "translate(-50%, -115%)",
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold">{hover.symbol}</span>
            <span className="text-muted-foreground">#{hover.rank}</span>
          </div>
          <div className="truncate text-muted-foreground">{hover.name}</div>
          <div className="tabular mt-1">Underwater {pct(hover.underwater)}</div>
          <div className="tabular text-muted-foreground">vs cost basis {signedPct(hover.priceVsVwap, 1)}</div>
          <div className="tabular text-muted-foreground">mcap {usd(hover.marketCap)}</div>
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Volume-by-price profile
 * ------------------------------------------------------------------ */

export function VolumeProfile({ buckets, price, vwap }: { buckets: ProfileBucket[]; price: number; vwap: number }) {
  if (buckets.length === 0) return <div className="text-sm text-muted-foreground">No profile.</div>;
  const max = Math.max(...buckets.map((b) => b.volume), 1);
  const rows = [...buckets].reverse();
  return (
    <div className="flex flex-col gap-[3px]">
      {rows.map((b, i) => {
        const w = (b.volume / max) * 100;
        const isAbove = b.price > price;
        const nearPrice = Math.abs(Math.log(b.price / price)) < Math.log(1.06);
        return (
          <div
            key={i}
            className="h-2.5 rounded-sm"
            style={{
              width: `${Math.max(w, 0.6)}%`,
              background: isAbove ? UNDERWATER : PROFIT,
              opacity: isAbove ? 0.65 : 0.6,
              outline: nearPrice ? `1px solid ${INK}` : "none",
            }}
            title={`${usd(b.price)} · ${usd(b.volume)}`}
          />
        );
      })}
      <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="tabular">cost basis {usd(vwap)}</span>
        <span className="tabular text-foreground">now {usd(price)}</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Sparkline: price vs expanding cost basis
 * ------------------------------------------------------------------ */

export function Sparkline({
  price,
  vwap,
  color = PROFIT,
  height = 48,
}: {
  price: number[];
  vwap: number[];
  color?: string;
  height?: number;
}) {
  const width = 260;
  const all = [...price, ...vwap].filter((v) => Number.isFinite(v) && v > 0);
  if (all.length < 2) return null;
  const min = Math.min(...all);
  const max = Math.max(...all);
  const x = (i: number, n: number) => (n <= 1 ? 0 : (i / (n - 1)) * width);
  const y = (v: number) => (max === min ? height / 2 : (1 - (v - min) / (max - min)) * height);
  const toPts = (arr: number[]): Array<[number, number]> => arr.map((v, i) => [x(i, arr.length), y(v)]);
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="none">
      <path d={linePath(toPts(vwap))} fill="none" stroke={COST} strokeWidth="1.5" strokeDasharray="4 4" />
      <path d={linePath(toPts(price))} fill="none" stroke={color} strokeWidth="2" />
    </svg>
  );
}

/* ------------------------------------------------------------------ *
 * Simple horizontal bar
 * ------------------------------------------------------------------ */

export function HBar({ value, color, height = 8 }: { value: number; color: string; height?: number }) {
  return (
    <div className="w-full rounded-full bg-muted" style={{ height }}>
      <div
        className="rounded-full transition-[width]"
        style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%`, height, background: color }}
      />
    </div>
  );
}
