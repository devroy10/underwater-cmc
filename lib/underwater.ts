/**
 * The UNDERWATER metrics engine. Pure functions only — no I/O — so the whole
 * model is unit-testable and safe to run on the server or in a worker.
 *
 * Definitions (also surfaced in the UI methodology panel):
 *
 *   cost basis (VWAP_w)  = Σ(price_i · volume_i) / Σ(volume_i)
 *                          over the trailing window w.
 *
 *   underwater(a)        = Σ volume_i where price_i > price_now
 *                          ─────────────────────────────────────
 *                                   Σ volume_i
 *                          i.e. the share of the window's traded volume that
 *                          changed hands ABOVE today's price. Those are the
 *                          buyers currently holding a loss — the supply that
 *                          must be absorbed before price can travel.
 *
 *   painDepth(a)         = volume-weighted average loss of that underwater
 *                          portion, in fractional terms.
 *
 * Because CMC exposes price and 24h volume but not realised cost basis, VWAP
 * is used as the standard proxy for the market's aggregate cost basis. The
 * method section states this assumption explicitly.
 */

import {
  type AssetStats,
  type CmcFearGreedPoint,
  type CmcHistoricalSeries,
  type CmcListing,
  type Dataset,
  type MarketPoint,
  type ProfileBucket,
  type Sector,
  type SectorSummary,
  type SlimDataset,
  SECTORS,
} from "./types";

export interface BuildInput {
  listings: CmcListing[];
  history: CmcHistoricalSeries[];
  fng: CmcFearGreedPoint[];
  source: "live" | "snapshot";
  windowDays: number;
  generatedAt: string;
  warnings: string[];
}

const MIN_POINTS = 120; // need most of the window to trust the metric
const PROFILE_BUCKETS = 26;
const SPARK_POINTS = 56;
const MARKET_SERIES_MIN_DAYS = 45;

/* ------------------------------------------------------------------ *
 * Classification
 * ------------------------------------------------------------------ */

const STABLE_TAGS = new Set(["stablecoin", "stablecoins", "usd-stablecoin"]);
const STABLE_SYMBOLS = new Set([
  "USDT", "USDC", "DAI", "FDUSD", "TUSD", "USDE", "USDS", "PYUSD", "BUSD",
  "USDD", "FRAX", "USDP", "GUSD", "USD1", "USDF", "USDG", "RLUSD", "EURC",
  "USDT0", "USDS", "SUSD", "MIM", "LUSD", "DOLA", "USDB", "YUSD", "USDR",
]);

export function isStablecoin(symbol: string, tags: string[]): boolean {
  if (STABLE_SYMBOLS.has(symbol.toUpperCase())) return true;
  return tags.some((t) => STABLE_TAGS.has(t));
}

/** Ordered tag → sector rules; first match wins. */
const SECTOR_RULES: Array<{ sector: Sector; tags: Set<string> }> = [
  { sector: "Stablecoin", tags: STABLE_TAGS },
  {
    sector: "Real World Assets",
    tags: new Set([
      "real-world-assets-rwa", "rwa", "tokenized-stock", "tokenized-stocks",
      "tokenized-treasury-bills", "tokenized-gold", "tokenized-assets",
      "tokenized-real-estate", "xstocks-ecosystem",
    ]),
  },
  {
    sector: "AI & Big Data",
    tags: new Set(["ai-big-data", "artificial-intelligence", "ai-agents", "ai-agent"]),
  },
  {
    sector: "DeFi",
    tags: new Set([
      "defi", "decentralized-finance-defi", "dex", "lending-borrowing",
      "yield-farming", "liquid-staking-tokens", "liquid-staking",
      "decentralized-exchange", "perpetuals", "derivatives",
    ]),
  },
  {
    sector: "Layer 2",
    tags: new Set(["layer-2", "optimistic-rollup", "zero-knowledge-rollup", "rollup"]),
  },
  { sector: "Layer 1", tags: new Set(["layer-1", "proof-of-stake-pos", "proof-of-work-pow"]) },
  {
    sector: "Gaming",
    tags: new Set(["gaming", "game-fi", "play-to-earn", "metaverse", "nft-gaming"]),
  },
  {
    sector: "Memes",
    tags: new Set(["memes", "dog-themed", "cat-themed", "frog-themed", "meme"]),
  },
  {
    sector: "Privacy",
    tags: new Set(["privacy", "privacy-coins", "zero-knowledge-zk", "privacy-tokens"]),
  },
  {
    sector: "Infrastructure",
    tags: new Set([
      "infrastructure", "oracles", "interoperability", "scaling", "storage",
      "smart-contracts", "cross-chain", "bridges",
    ]),
  },
];

export function classifySector(tags: string[], stable: boolean): Sector {
  if (stable) return "Stablecoin";
  const tagSet = new Set(tags.map((t) => t.toLowerCase()));
  for (const rule of SECTOR_RULES) {
    for (const tag of tagSet) {
      if (rule.tags.has(tag)) return rule.sector;
    }
  }
  return "Other";
}

/* ------------------------------------------------------------------ *
 * Asset-level metric
 * ------------------------------------------------------------------ */

interface Point {
  t: number; // epoch ms
  price: number;
  volume: number;
}

function historyPoints(series: CmcHistoricalSeries): Point[] {
  const points: Point[] = [];
  for (const row of series.quotes) {
    const { price, volume_24h } = row.quote.USD;
    if (price === null || volume_24h === null || price <= 0 || volume_24h <= 0) {
      continue;
    }
    const t = Date.parse(row.timestamp);
    if (Number.isNaN(t)) continue;
    points.push({ t, price, volume: volume_24h });
  }
  points.sort((a, b) => a.t - b.t);
  return points;
}

function downsample<T>(values: T[], max: number): T[] {
  if (values.length <= max) return values;
  const stride = values.length / max;
  const out: T[] = [];
  for (let i = 0; i < max; i += 1) {
    out.push(values[Math.min(values.length - 1, Math.round(i * stride))]);
  }
  return out;
}

function logProfile(points: Point[], currentPrice: number): ProfileBucket[] {
  const prices = points.map((p) => p.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices, currentPrice);
  if (!(max > min)) return [];
  const logMin = Math.log(min);
  const logMax = Math.log(max);
  const buckets: ProfileBucket[] = Array.from({ length: PROFILE_BUCKETS }, (_, i) => {
    const mid = Math.exp(logMin + ((i + 0.5) / PROFILE_BUCKETS) * (logMax - logMin));
    return { price: mid, volume: 0 };
  });
  for (const point of points) {
    const ratio = (Math.log(point.price) - logMin) / (logMax - logMin);
    const index = Math.min(PROFILE_BUCKETS - 1, Math.max(0, Math.floor(ratio * PROFILE_BUCKETS)));
    const bucket = buckets[index];
    if (bucket) bucket.volume += point.volume;
  }
  return buckets;
}

export function computeAssetStats(
  listing: CmcListing,
  series: CmcHistoricalSeries,
): AssetStats | null {
  const points = historyPoints(series);
  if (points.length < MIN_POINTS) return null;

  const usd = listing.quote.USD;
  const now = usd.price;
  if (now === null || now <= 0) return null;

  let totalVolume = 0;
  let weightedPrice = 0;
  let underwaterVolume = 0;
  let weightedLoss = 0;

  for (const point of points) {
    totalVolume += point.volume;
    weightedPrice += point.price * point.volume;
    if (point.price > now) {
      underwaterVolume += point.volume;
      weightedLoss += point.volume * ((point.price - now) / point.price);
    }
  }
  if (totalVolume <= 0) return null;

  const vwap = weightedPrice / totalVolume;
  const underwater = underwaterVolume / totalVolume;
  const painDepth = underwaterVolume > 0 ? weightedLoss / underwaterVolume : 0;
  const stable = isStablecoin(listing.symbol, listing.tags);

  // Sparklines: price and the expanding cost basis at sampled days.
  let runningVol = 0;
  let runningWeighted = 0;
  const priceSeries: number[] = [];
  const vwapSeries: number[] = [];
  for (let i = 0; i < points.length; i += 1) {
    const point = points[i];
    if (!point) continue;
    runningVol += point.volume;
    runningWeighted += point.price * point.volume;
    priceSeries.push(point.price);
    vwapSeries.push(runningWeighted / runningVol);
  }

  return {
    id: listing.id,
    symbol: listing.symbol,
    name: listing.name,
    slug: listing.slug,
    rank: listing.cmc_rank ?? 99999,
    sector: classifySector(listing.tags, stable),
    isStable: stable,
    price: now,
    marketCap: usd.market_cap ?? 0,
    volume24h: usd.volume_24h ?? 0,
    vwap,
    priceVsVwap: vwap > 0 ? now / vwap - 1 : 0,
    underwater,
    painDepth,
    underwaterVolume,
    profitVolume: totalVolume - underwaterVolume,
    points: points.length,
    priceSeries: downsample(priceSeries, SPARK_POINTS),
    vwapSeries: downsample(vwapSeries, SPARK_POINTS),
    profile: logProfile(points, now),
  };
}

/* ------------------------------------------------------------------ *
 * Market-level time series
 * ------------------------------------------------------------------ */

function dayKey(epochMs: number): string {
  return new Date(epochMs).toISOString().slice(0, 10);
}

export function computeMarketSeries(
  perAsset: Array<{ points: Point[]; volumeWeight: number }>,
  fngByDay: Map<string, number>,
): MarketPoint[] {
  const timeline = new Set<string>();
  for (const asset of perAsset) {
    for (const point of asset.points) timeline.add(dayKey(point.t));
  }
  const days = [...timeline].sort();
  if (days.length === 0) return [];

  const out: MarketPoint[] = [];
  for (let d = 0; d < days.length; d += 1) {
    if (d < MARKET_SERIES_MIN_DAYS) continue; // let the window fill first
    const cutoff = Date.parse(`${days[d]}T23:59:59.999Z`);

    let weighted = 0;
    let weight = 0;
    let below = 0;
    let counted = 0;

    for (const asset of perAsset) {
      // Rows up to the cutoff, and the latest price we know at this date.
      let sumVol = 0;
      let sumWeighted = 0;
      let sumUnder = 0;
      let lastPrice = 0;
      for (const point of asset.points) {
        if (point.t > cutoff) break;
        sumVol += point.volume;
        sumWeighted += point.price * point.volume;
        lastPrice = point.price;
      }
      if (sumVol <= 0 || lastPrice <= 0) continue;
      for (const point of asset.points) {
        if (point.t > cutoff) break;
        if (point.price > lastPrice) sumUnder += point.volume;
      }
      const assetUnderwater = sumUnder / sumVol;
      const basis = sumWeighted / sumVol;
      weighted += assetUnderwater * asset.volumeWeight;
      weight += asset.volumeWeight;
      counted += 1;
      if (lastPrice < basis) below += 1;
    }

    if (weight <= 0 || counted === 0) continue;
    const day = days[d];
    if (!day) continue;
    out.push({
      t: day,
      underwater: weighted / weight,
      breadth: below / counted,
      fng: fngByDay.get(day) ?? null,
    });
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * Dataset assembly
 * ------------------------------------------------------------------ */

export function buildDataset(input: BuildInput): Dataset {
  const { listings, history, fng, source, windowDays, generatedAt, warnings } = input;
  const listingById = new Map(listings.map((l) => [l.id, l]));

  const assets: AssetStats[] = [];
  const marketInputs: Array<{ points: Point[]; volumeWeight: number }> = [];
  const droppedForHistory: string[] = [];

  for (const series of history) {
    const listing = listingById.get(series.id);
    if (!listing) continue;
    const stats = computeAssetStats(listing, series);
    if (!stats) {
      droppedForHistory.push(listing.symbol);
      continue;
    }
    assets.push(stats);
    if (!stats.isStable) {
      marketInputs.push({
        points: historyPoints(series),
        volumeWeight: Math.max(stats.volume24h, 1),
      });
    }
  }

  assets.sort((a, b) => a.rank - b.rank);

  if (droppedForHistory.length > 0) {
    warnings.push(
      `Excluded ${droppedForHistory.length} assets with insufficient history (< ${MIN_POINTS} daily points).`,
    );
  }

  const fngByDay = new Map<string, number>();
  for (const point of fng) {
    const seconds = Number(point.timestamp);
    if (!Number.isFinite(seconds)) continue;
    fngByDay.set(dayKey(seconds * 1000), point.value);
  }

  const marketSeries = computeMarketSeries(marketInputs, fngByDay);

  // Headline market figures, volume-weighted across non-stable assets.
  let totalVolume = 0;
  let underwaterVolume = 0;
  let marketCap = 0;
  let belowCount = 0;
  let counted = 0;
  for (const asset of assets) {
    marketCap += asset.marketCap;
    if (asset.isStable) continue;
    totalVolume += asset.underwaterVolume + asset.profitVolume;
    underwaterVolume += asset.underwaterVolume;
    if (asset.price < asset.vwap) belowCount += 1;
    counted += 1;
  }

  const latestFng = fng[0];
  const latestSeries = marketSeries[marketSeries.length - 1];

  const sectors = summarizeSectors(assets);
  const asOf = listings.reduce<string>((acc, l) => {
    const ts = l.quote.USD.last_updated ?? l.last_updated;
    return ts > acc ? ts : acc;
  }, generatedAt);

  return {
    generatedAt,
    source,
    asOf,
    window: `${windowDays}d`,
    universe: counted,
    assets,
    marketSeries,
    sectors,
    market: {
      underwater: totalVolume > 0 ? underwaterVolume / totalVolume : 0,
      volume: totalVolume,
      breadth: counted > 0 ? belowCount / counted : 0,
      fng: latestSeries?.fng ?? (latestFng ? latestFng.value : null),
      fngLabel: latestFng ? latestFng.value_classification : null,
      marketCap,
    },
    warnings,
  };
}

export function summarizeSectors(assets: AssetStats[]): SectorSummary[] {
  const bySector = new Map<Sector, { count: number; marketCap: number; uwVol: number; vol: number }>();
  for (const sector of SECTORS) {
    bySector.set(sector, { count: 0, marketCap: 0, uwVol: 0, vol: 0 });
  }
  for (const asset of assets) {
    if (asset.isStable) continue;
    const entry = bySector.get(asset.sector);
    if (!entry) continue;
    entry.count += 1;
    entry.marketCap += asset.marketCap;
    entry.uwVol += asset.underwaterVolume;
    entry.vol += asset.underwaterVolume + asset.profitVolume;
  }
  return [...bySector.entries()]
    .filter(([, v]) => v.count > 0)
    .map(([sector, v]) => ({
      sector,
      count: v.count,
      marketCap: v.marketCap,
      underwater: v.vol > 0 ? v.uwVol / v.vol : 0,
    }))
    .sort((a, b) => b.marketCap - a.marketCap);
}

/* ------------------------------------------------------------------ *
 * Portfolio
 * ------------------------------------------------------------------ */

export interface Holding {
  symbol: string;
  /** Current USD value of the position. */
  value: number;
}

export interface PortfolioCandidate {
  symbol: string;
  underwater: number;
  priceVsVwap: number;
}

export interface PortfolioResult<T extends PortfolioCandidate = AssetStats> {
  totalValue: number;
  /** Value-weighted underwater share across matched holdings. */
  underwater: number;
  /** Value-weighted price vs cost basis across matched holdings. */
  priceVsVwap: number;
  matched: Array<{ asset: T; value: number; weight: number }>;
  unknown: string[];
}

export function computePortfolio<T extends PortfolioCandidate>(
  assets: T[],
  holdings: Holding[],
): PortfolioResult<T> {
  const bySymbol = new Map(assets.map((a) => [a.symbol.toUpperCase(), a]));
  const matched: Array<{ asset: T; value: number; weight: number }> = [];
  const unknown: string[] = [];
  let total = 0;

  for (const holding of holdings) {
    const asset = bySymbol.get(holding.symbol.toUpperCase());
    if (!asset || !(holding.value > 0)) {
      unknown.push(holding.symbol);
      continue;
    }
    total += holding.value;
    matched.push({ asset, value: holding.value, weight: holding.value });
  }

  if (total <= 0) {
    return { totalValue: 0, underwater: 0, priceVsVwap: 0, matched: [], unknown };
  }

  let uw = 0;
  let pv = 0;
  for (const row of matched) {
    row.weight = row.value / total;
    uw += row.asset.underwater * row.weight;
    pv += row.asset.priceVsVwap * row.weight;
  }
  return {
    totalValue: total,
    underwater: uw,
    priceVsVwap: pv,
    matched: matched.sort((a, b) => b.value - a.value),
    unknown,
  };
}

/* ------------------------------------------------------------------ *
 * Serialization
 * ------------------------------------------------------------------ */

/** Drop the heavy per-asset arrays before crossing the server→client boundary. */
export function toSlim(dataset: Dataset): SlimDataset {
  return {
    ...dataset,
    assets: dataset.assets.map(({ priceSeries, vwapSeries, profile, ...rest }) => {
      void priceSeries;
      void vwapSeries;
      void profile;
      return rest;
    }),
  };
}
