"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * The bklit charts are animation-heavy and measure their container, so they are
 * rendered client-only (no SSR). Each shows a skeleton until it hydrates.
 */
export const MarketIndexChart = dynamic(
  () => import("./chart-impl").then((m) => m.MarketIndexChart),
  { ssr: false, loading: () => <Skeleton className="h-80 w-full" /> },
);

export const UnderwaterRing = dynamic(
  () => import("./chart-impl").then((m) => m.UnderwaterRing),
  { ssr: false, loading: () => <Skeleton className="size-48 rounded-full" /> },
);

export const SectorBarChart = dynamic(
  () => import("./chart-impl").then((m) => m.SectorBarChart),
  { ssr: false, loading: () => <Skeleton className="h-64 w-full" /> },
);
