"use client";

import { useDeferredValue, useMemo, useState } from "react";
import type { Sector, SlimAsset } from "@/lib/types";
import { SECTORS } from "@/lib/types";
import { SECTOR_COLORS, pct, signedPct, usd } from "@/lib/format";
import { HBar } from "./charts";
import { useSelection } from "./selection";

type SortKey = "underwater" | "priceVsVwap" | "marketCap" | "rank";

const SORTS: Array<{ key: SortKey; label: string }> = [
  { key: "underwater", label: "Most underwater" },
  { key: "priceVsVwap", label: "Furthest below cost basis" },
  { key: "marketCap", label: "Largest" },
  { key: "rank", label: "Rank" },
];

export function Explorer({ assets }: { assets: SlimAsset[] }) {
  const { selectedId, select } = useSelection();
  const [query, setQuery] = useState("");
  const [sector, setSector] = useState<Sector | "all">("all");
  const [sortKey, setSortKey] = useState<SortKey>("underwater");
  const [limit, setLimit] = useState(25);
  const [largeOnly, setLargeOnly] = useState(true);
  const deferredQuery = useDeferredValue(query);

  const rows = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    const filtered = assets.filter((a) => {
      if (a.isStable) return false;
      if (largeOnly && a.marketCap < 1e9) return false;
      if (sector !== "all" && a.sector !== sector) return false;
      if (!q) return true;
      return a.symbol.toLowerCase().includes(q) || a.name.toLowerCase().includes(q);
    });
    const sorted = [...filtered].sort((a, b) => {
      if (sortKey === "rank") return a.rank - b.rank;
      if (sortKey === "marketCap") return b.marketCap - a.marketCap;
      if (sortKey === "priceVsVwap") return a.priceVsVwap - b.priceVsVwap;
      return b.underwater - a.underwater;
    });
    return sorted;
  }, [assets, deferredQuery, sector, sortKey, largeOnly]);

  const visible = rows.slice(0, limit);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search symbol or name"
          aria-label="Search assets"
          className="min-w-[200px] flex-1 rounded-lg border border-line bg-panel-2/60 px-3 py-2 text-sm text-ink outline-none placeholder:text-faint focus:border-line-strong"
        />
        <select
          aria-label="Filter by sector"
          value={sector}
          onChange={(event) => setSector(event.target.value as Sector | "all")}
          className="rounded-lg border border-line bg-panel-2/60 px-3 py-2 text-sm text-ink outline-none focus:border-line-strong"
        >
          <option value="all">All sectors</option>
          {SECTORS.filter((s) => s !== "Stablecoin").map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          aria-label="Sort assets"
          value={sortKey}
          onChange={(event) => setSortKey(event.target.value as SortKey)}
          className="rounded-lg border border-line bg-panel-2/60 px-3 py-2 text-sm text-ink outline-none focus:border-line-strong"
        >
          {SORTS.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-panel-2/60 px-3 py-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={largeOnly}
            onChange={(event) => setLargeOnly(event.target.checked)}
            className="accent-clean"
          />
          $1B+ cap
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-left text-[11px] uppercase tracking-wider text-faint">
              <th className="py-2 pr-3 font-normal">#</th>
              <th className="py-2 pr-3 font-normal">Asset</th>
              <th className="py-2 pr-3 font-normal">Sector</th>
              <th className="py-2 pr-3 font-normal">Underwater supply</th>
              <th className="py-2 pr-3 text-right font-normal">vs cost basis</th>
              <th className="py-2 pl-3 text-right font-normal">Market cap</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((a) => (
              <tr
                key={a.id}
                tabIndex={0}
                onClick={() => select(a.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    select(a.id);
                  }
                }}
                className={`cursor-pointer border-b border-line/60 transition-colors hover:bg-panel-2 focus:bg-panel-2 focus:outline-none ${
                  selectedId === a.id ? "bg-panel-2" : ""
                }`}
              >
                <td className="tabular py-2.5 pr-3 text-muted">{a.rank}</td>
                <td className="py-2.5 pr-3">
                  <div className="font-medium text-ink">{a.symbol}</div>
                  <div className="max-w-[180px] truncate text-xs text-muted">{a.name}</div>
                </td>
                <td className="py-2.5 pr-3">
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted">
                    <span className="inline-block h-2 w-2 rounded-full" style={{ background: SECTOR_COLORS[a.sector] }} />
                    {a.sector}
                  </span>
                </td>
                <td className="py-2.5 pr-3">
                  <div className="flex items-center gap-2">
                    <div className="w-24">
                      <HBar value={a.underwater} color={a.underwater > 0.5 ? "#f43f5e" : "#38bdf8"} height={6} />
                    </div>
                    <span className="tabular text-ink">{pct(a.underwater)}</span>
                  </div>
                </td>
                <td className={`tabular py-2.5 pr-3 text-right ${a.priceVsVwap < 0 ? "text-trapped" : "text-good"}`}>
                  {signedPct(a.priceVsVwap, 1)}
                </td>
                <td className="tabular py-2.5 pl-3 text-right text-muted">{usd(a.marketCap)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-xs text-muted">
        <span>
          {visible.length} of {rows.length} assets
        </span>
        {visible.length < rows.length ? (
          <button
            onClick={() => setLimit((n) => n + 25)}
            className="rounded-md border border-line px-3 py-1.5 text-ink hover:border-line-strong"
          >
            Show more
          </button>
        ) : null}
      </div>
    </div>
  );
}
