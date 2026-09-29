/**
 * Dataset access.
 *
 * `getSnapshot()` reads the bundled, build-time dataset (committed to the repo
 * so the demo always renders, with zero API calls). `buildLiveDataset()` runs
 * the same engine against the live API and is used by the refresh endpoint and
 * the `build:dataset` script.
 *
 * Server-only: this module pulls in the CMC client which reads the API key.
 */

import snapshotJson from "../data/underwater-snapshot.json";
import {
  fetchFearGreed,
  fetchGlobalLatest,
  fetchHistoryBatch,
  fetchListings,
  sleep,
} from "./cmc";
import { buildDataset } from "./underwater";
import type { CmcFearGreedPoint, Dataset } from "./types";

export const DEFAULT_UNIVERSE = 200;
export const DEFAULT_WINDOW_DAYS = 365;
const INTERVAL = "daily";

const SNAPSHOT = snapshotJson as unknown as Dataset;

export function getSnapshot(): Dataset {
  return SNAPSHOT;
}

export interface LiveResult {
  dataset: Dataset;
  credits: number;
  errors: string[];
}

export async function buildLiveDataset(options?: {
  universe?: number;
  windowDays?: number;
}): Promise<LiveResult> {
  const universe = Math.min(Math.max(options?.universe ?? DEFAULT_UNIVERSE, 20), 350);
  const windowDays = Math.min(Math.max(options?.windowDays ?? DEFAULT_WINDOW_DAYS, 120), 365);
  const warnings: string[] = [];
  const errors: string[] = [];
  let credits = 0;

  const listingsResult = await fetchListings(universe);
  if (!listingsResult.ok) {
    throw new Error(`listings/latest failed — ${listingsResult.message}`);
  }
  credits += listingsResult.credits;
  const listings = listingsResult.data;
  if (listings.length < universe) {
    warnings.push(`Requested ${universe} assets; API returned ${listings.length}.`);
  }

  const ids = listings.map((l) => l.id);
  const historyResult = await fetchHistoryBatch(ids, INTERVAL, windowDays);
  credits += historyResult.credits;
  errors.push(...historyResult.errors);
  if (historyResult.series.length === 0) {
    throw new Error("quotes/historical returned no series");
  }

  // Optional context + sentiment; a failure here never blocks the core metric.
  let fng: CmcFearGreedPoint[] = [];
  const fngResult = await fetchFearGreed(windowDays);
  if (fngResult.ok) {
    credits += fngResult.credits;
    fng = fngResult.data;
  } else {
    warnings.push(`fear-and-greed unavailable: ${fngResult.message}`);
  }

  const globalResult = await fetchGlobalLatest();
  let context: Dataset["context"];
  if (globalResult.ok) {
    credits += globalResult.credits;
    context = {
      totalMarketCap: globalResult.data.quote.USD.total_market_cap ?? 0,
      btcDominance: globalResult.data.btc_dominance,
      altcoinMarketCap: globalResult.data.quote.USD.altcoin_market_cap,
    };
  } else {
    warnings.push(`global-metrics unavailable: ${globalResult.message}`);
  }

  await sleep(0); // yield

  const dataset = buildDataset({
    listings,
    history: historyResult.series,
    fng,
    source: "live",
    windowDays,
    generatedAt: new Date().toISOString(),
    warnings,
  });
  if (context) dataset.context = context;

  return { dataset, credits, errors };
}
