"use client";

import {
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryState,
} from "nuqs";

/** URL-backed selection of the open asset (`?asset=1`). */
export function useAssetSelection() {
  const [selectedId, setSelectedId] = useQueryState("asset", parseAsInteger);
  return { selectedId, select: setSelectedId };
}

export const SORT_KEYS = ["underwater", "priceVsVwap", "marketCap", "rank"] as const;
export type SortKey = (typeof SORT_KEYS)[number];

/** URL-backed explorer state so views are shareable and survive refresh. */
export function useExplorerState() {
  const [query, setQuery] = useQueryState("q", parseAsString.withDefault(""));
  const [sector, setSector] = useQueryState("sector", parseAsString.withDefault("all"));
  const [sort, setSort] = useQueryState(
    "sort",
    parseAsStringLiteral(SORT_KEYS).withDefault("underwater"),
  );
  const [largeOnly, setLargeOnly] = useQueryState("large", parseAsBoolean.withDefault(true));
  return { query, setQuery, sector, setSector, sort, setSort, largeOnly, setLargeOnly };
}
