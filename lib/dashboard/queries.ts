"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AssetDetail, SlimDataset } from "@/lib/types";

/**
 * The dataset is server-rendered from the bundled snapshot, so the query has no
 * remote fetcher. Refresh is a mutation that swaps the cache entry.
 */
export function useDataset(initial: SlimDataset) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["dataset"],
    queryFn: () => initial,
    initialData: initial,
    staleTime: Infinity,
  });

  const refresh = useMutation({
    mutationFn: async (): Promise<SlimDataset> => {
      const res = await fetch("/api/refresh", { method: "POST" });
      const body: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        const message =
          body && typeof body === "object" && "error" in body
            ? String((body as { error: unknown }).error)
            : `HTTP ${res.status}`;
        throw new Error(message);
      }
      return (body as { dataset: SlimDataset }).dataset;
    },
    onSuccess: (dataset) => {
      queryClient.setQueryData(["dataset"], dataset);
    },
  });

  return { dataset: query.data ?? initial, refresh };
}

export function useAssetDetail(id: number | null) {
  return useQuery({
    queryKey: ["asset", id],
    enabled: id !== null,
    queryFn: async (): Promise<AssetDetail> => {
      const res = await fetch(`/api/asset?id=${id}`);
      if (!res.ok) throw new Error(`Could not load asset ${id}`);
      return (await res.json()) as AssetDetail;
    },
  });
}

export interface AnalystSummary {
  underwater: number;
  breadth: number;
  volume: number;
  fng: number | null;
  window: string;
  trapped: Array<{ symbol: string; underwater: number; vsCostBasis: number }>;
  clean: Array<{ symbol: string; underwater: number; vsCostBasis: number }>;
}

export function useAnalystRead() {
  return useMutation({
    mutationFn: async (summary: AnalystSummary): Promise<string> => {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(summary),
      });
      const body: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        const message =
          body && typeof body === "object" && "error" in body
            ? String((body as { error: unknown }).error)
            : `HTTP ${res.status}`;
        throw new Error(message);
      }
      return (body as { text: string }).text;
    },
  });
}
