/**
 * Console/markdown report used by the dataset build script and the refresh
 * endpoint's logs. Keeps the "credit cost + headline" summary in one place.
 */

import { pct, usd } from "./format";
import type { Dataset } from "./types";

export function formatCreditReport(dataset: Dataset, credits: number, durationMs: number): string {
  const lines = [
    `source:            ${dataset.source}`,
    `as of:             ${dataset.asOf}`,
    `universe:          ${dataset.universe} assets (${dataset.assets.length} with stats)`,
    `window:            ${dataset.window}`,
    `market underwater: ${pct(dataset.market.underwater)} of ${usd(dataset.market.volume)} traded volume`,
    `universe breadth:  ${pct(dataset.market.breadth)} below cost basis`,
    `credits used:      ${credits}`,
    `wall time:         ${(durationMs / 1000).toFixed(1)}s`,
  ];
  return lines.join("\n");
}
