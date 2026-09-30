/** Presentation helpers. Pure, framework-free. */

import type { Sector } from "./types";

const COMPACT = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

/** $1.2T / $34.5B / $9.9M / $12.3K */
export function usd(value: number): string {
  if (!Number.isFinite(value)) return "n/a";
  const abs = Math.abs(value);
  if (abs >= 1_000) return `$${COMPACT.format(value)}`;
  if (abs >= 1) return `$${value.toFixed(2)}`;
  if (abs >= 0.01) return `$${value.toFixed(4)}`;
  return `$${value.toPrecision(3)}`;
}

export function usdExact(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 1 ? 2 : 6,
  }).format(value);
}

/** 0.43 -> "43%" */
export function pct(fraction: number, digits = 0): string {
  if (!Number.isFinite(fraction)) return "n/a";
  return `${(fraction * 100).toFixed(digits)}%`;
}

/** 0.43 -> "+43%" */
export function signedPct(fraction: number, digits = 0): string {
  if (!Number.isFinite(fraction)) return "n/a";
  const v = (fraction * 100).toFixed(digits);
  return `${fraction >= 0 ? "+" : ""}${v}%`;
}

export function num(value: number, digits = 0): string {
  if (!Number.isFinite(value)) return "n/a";
  return value.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/** CoinMarketCap token logo, served from their CDN. */
export function cmcLogoUrl(id: number): string {
  return `https://s2.coinmarketcap.com/static/img/coins/64x64/${id}.png`;
}

export function shortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });
}

/** Color for an underwater share: clean (blue/green) -> trapped (red). */
export function underwaterColor(share: number): string {
  const clamped = Math.max(0, Math.min(1, share));
  // blue (#38bdf8) -> amber (#f59e0b) -> red (#ef4444)
  const stops = [
    { at: 0.0, rgb: [56, 189, 248] },
    { at: 0.5, rgb: [245, 158, 11] },
    { at: 1.0, rgb: [239, 68, 68] },
  ] as const;
  for (let i = 0; i < stops.length - 1; i += 1) {
    const a = stops[i];
    const b = stops[i + 1];
    if (!a || !b) break;
    if (clamped >= a.at && clamped <= b.at) {
      const t = (clamped - a.at) / (b.at - a.at);
      const rgb = a.rgb.map((c, idx) => Math.round(c + ((b.rgb[idx] ?? c) - c) * t));
      return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
    }
  }
  return "rgb(239, 68, 68)";
}

export const SECTOR_COLORS: Record<Sector, string> = {
  Stablecoin: "#94a3b8",
  "AI & Big Data": "#a78bfa",
  DeFi: "#22d3ee",
  "CeFi & Exchange": "#facc15",
  "Layer 1": "#60a5fa",
  "Layer 2": "#818cf8",
  Memes: "#fb923c",
  "Real World Assets": "#34d399",
  Gaming: "#f472b6",
  Privacy: "#c084fc",
  Infrastructure: "#38bdf8",
  Other: "#64748b",
};
