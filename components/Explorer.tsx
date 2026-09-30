"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { SECTORS, type SlimAsset } from "@/lib/types";
import { SECTOR_COLORS, pct, signedPct, usd } from "@/lib/format";
import { cn } from "@/lib/utils";
import { SORT_KEYS, useAssetSelection, useExplorerState, type SortKey } from "@/lib/dashboard/state";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { HBar } from "./charts";
import { TokenLogo } from "@/components/dashboard/token-logo";

const SORT_LABELS: Record<SortKey, string> = {
  underwater: "Most underwater",
  priceVsVwap: "Furthest below cost basis",
  marketCap: "Largest",
  rank: "Rank",
};

const SORT_ITEMS = SORT_KEYS.map((value) => ({ value, label: SORT_LABELS[value] }));
const SECTOR_ITEMS = [
  { value: "all", label: "All sectors" },
  ...SECTORS.filter((s) => s !== "Stablecoin").map((s) => ({ value: s, label: s })),
];

export function Explorer({ assets }: { assets: SlimAsset[] }) {
  const { selectedId, select } = useAssetSelection();
  const { query, setQuery, sector, setSector, sort, setSort, largeOnly, setLargeOnly } =
    useExplorerState();
  const [limit, setLimit] = useState(25);
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
      if (sort === "rank") return a.rank - b.rank;
      if (sort === "marketCap") return b.marketCap - a.marketCap;
      if (sort === "priceVsVwap") return a.priceVsVwap - b.priceVsVwap;
      return b.underwater - a.underwater;
    });
    return sorted;
  }, [assets, deferredQuery, sector, sort, largeOnly]);

  const visible = rows.slice(0, limit);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search symbol or name"
          aria-label="Search assets"
          className="min-w-[200px] flex-1"
        />
        <Select items={SECTOR_ITEMS} value={sector} onValueChange={(v) => setSector(v as string)}>
          <SelectTrigger className="w-[170px]" aria-label="Filter by sector">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {SECTOR_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Select items={SORT_ITEMS} value={sort} onValueChange={(v) => setSort(v as SortKey)}>
          <SelectTrigger className="w-[220px]" aria-label="Sort assets">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {SORT_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Switch checked={largeOnly} onCheckedChange={(checked) => setLargeOnly(checked)} />
          $1B+ cap
        </label>
      </div>

      {visible.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>No assets match</EmptyTitle>
            <EmptyDescription>Try a different search or clear the filters.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="overflow-x-auto">
          <Table className="min-w-[720px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead>Asset</TableHead>
                <TableHead>Sector</TableHead>
                <TableHead>Underwater supply</TableHead>
                <TableHead className="text-right">vs cost basis</TableHead>
                <TableHead className="text-right">Market cap</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((a) => (
                <TableRow
                  key={a.id}
                  tabIndex={0}
                  data-state={selectedId === a.id ? "selected" : undefined}
                  onClick={() => select(a.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      select(a.id);
                    }
                  }}
                  className="cursor-pointer focus-visible:bg-muted"
                >
                  <TableCell className="tabular text-muted-foreground">{a.rank}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <TokenLogo id={a.id} symbol={a.symbol} />
                      <div>
                        <div className="font-medium text-foreground">{a.symbol}</div>
                        <div className="max-w-[160px] truncate text-xs text-muted-foreground">
                          {a.name}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span
                        className="inline-block size-2 rounded-full"
                        style={{ background: SECTOR_COLORS[a.sector] }}
                      />
                      {a.sector}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-24">
                        <HBar
                          value={a.underwater}
                          color={a.underwater > 0.5 ? "var(--underwater)" : "var(--profit)"}
                          height={6}
                        />
                      </div>
                      <span className="tabular text-foreground">{pct(a.underwater)}</span>
                    </div>
                  </TableCell>
                  <TableCell
                    className={cn(
                      "tabular text-right",
                      a.priceVsVwap < 0 ? "text-underwater" : "text-profit",
                    )}
                  >
                    {signedPct(a.priceVsVwap, 1)}
                  </TableCell>
                  <TableCell className="tabular text-right text-muted-foreground">
                    {usd(a.marketCap)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {visible.length} of {rows.length} assets
        </span>
        {visible.length < rows.length ? (
          <Button variant="outline" size="sm" onClick={() => setLimit((n) => n + 25)}>
            Show more
          </Button>
        ) : null}
      </div>
    </div>
  );
}
