/**
 * Domain + transport types for UNDERWATER.
 *
 * Three layers live here:
 *  1. `Cmc*` types  - the raw shapes returned by the CoinMarketCap REST API
 *     (only the fields we consume, all nullable exactly as the API sends them).
 *  2. `CmcResult<T>` - a discriminated result so callers must handle failure
 *     instead of trusting a thrown error or an `any`.
 *  3. `AssetStats` / `Dataset` - the computed domain model the UI renders.
 *
 * No `any` is used anywhere; every external value is narrowed through a guard.
 */

/* ------------------------------------------------------------------ *
 * 1. Raw CoinMarketCap API shapes
 * ------------------------------------------------------------------ */

/** The `status` envelope CMC attaches to (almost) every response. */
export interface CmcStatus {
  timestamp: string;
  error_code: number | string;
  error_message: string | null;
  elapsed?: number;
  credit_count: number;
  notice?: string | null;
}

/** USD quote block on a `/listings/latest` row. */
export interface CmcListingQuote {
  price: number | null;
  volume_24h: number | null;
  cex_volume_24h: number | null;
  dex_volume_24h: number | null;
  percent_change_1h: number | null;
  percent_change_24h: number | null;
  percent_change_7d: number | null;
  percent_change_30d: number | null;
  percent_change_60d: number | null;
  percent_change_90d: number | null;
  market_cap: number | null;
  fully_diluted_market_cap: number | null;
  market_cap_dominance: number | null;
  last_updated: string | null;
}

/** One row of `/v1/cryptocurrency/listings/latest`. */
export interface CmcListing {
  id: number;
  name: string;
  symbol: string;
  slug: string;
  infinite_supply: boolean;
  circulating_supply: number | null;
  total_supply: number | null;
  max_supply: number | null;
  date_added: string;
  num_market_pairs: number | null;
  cmc_rank: number | null;
  last_updated: string;
  platform: { id: number; name: string; symbol: string; slug: string } | null;
  self_reported_circulating_supply: number | null;
  self_reported_market_cap: number | null;
  minted_market_cap: number | null;
  quote: Record<string, CmcListingQuote>;
  tags: string[];
}

/** One historical point from `/v1/cryptocurrency/quotes/historical`. */
export interface CmcHistoricalQuote {
  timestamp: string;
  quote: {
    USD: {
      price: number | null;
      volume_24h: number | null;
      market_cap: number | null;
      circulating_supply: number | null;
      total_supply: number | null;
      timestamp: string;
    };
  };
}

/** The per-asset object inside a `quotes/historical` response. */
export interface CmcHistoricalSeries {
  id: number;
  name: string;
  symbol: string;
  is_active: number;
  quotes: CmcHistoricalQuote[];
}

export interface CmcGlobalLatest {
  quote: {
    USD: {
      total_market_cap: number | null;
      total_volume_24h: number | null;
      altcoin_market_cap: number | null;
      altcoin_volume_24h: number | null;
      stablecoin_market_cap: number | null;
      last_updated: string | null;
    };
  };
  btc_dominance: number | null;
  eth_dominance: number | null;
  active_cryptocurrencies: number | null;
  active_exchanges: number | null;
  active_market_pairs: number | null;
  last_updated: string;
}

export interface CmcGlobalHistoricalPoint {
  timestamp: string;
  quote: {
    USD: {
      total_market_cap: number | null;
      total_volume_24h: number | null;
      altcoin_market_cap: number | null;
      altcoin_volume_24h: number | null;
    };
  };
  btc_dominance: number | null;
  eth_dominance: number | null;
}

export interface CmcFearGreedPoint {
  timestamp: string;
  value: number;
  value_classification: string;
}

export interface CmcCategory {
  id: string;
  name: string;
  title: string;
  description: string | null;
  volume: number | null;
  num_tokens: number | null;
  avg_price_change: number | null;
  market_cap: number | null;
  market_cap_change: number | null;
  volume_change: number | null;
  last_updated: string;
}

/** Discriminated transport result. */
export type CmcOk<T> = {
  ok: true;
  data: T;
  credits: number;
  status: CmcStatus;
};

export type CmcErr = {
  ok: false;
  httpStatus: number;
  errorCode: number | string;
  message: string;
};

export type CmcResult<T> = CmcOk<T> | CmcErr;

/* ------------------------------------------------------------------ *
 * 2. Runtime type guards (no `any`)
 * ------------------------------------------------------------------ */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStatus(value: unknown): value is CmcStatus {
  return isRecord(value) && "error_code" in value && "credit_count" in value;
}

/** Extract `{ data, status }` from an unknown JSON body. Returns null when it
 *  does not look like a CMC envelope at all. */
export function parseEnvelope(
  body: unknown,
): { data: unknown; status: CmcStatus } | null {
  if (!isRecord(body)) return null;
  if (!("status" in body) || !isStatus(body.status)) {
    // Gateway errors (503/404 from the edge) do not carry a status object.
    return null;
  }
  return { data: body.data, status: body.status };
}

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function str(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

/** Narrow one listing row. Drops the row when core identity fields are missing
 *  so a malformed element can never poison the dataset. */
export function parseListing(value: unknown): CmcListing | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== "number" || typeof value.symbol !== "string") {
    return null;
  }
  const quote = isRecord(value.quote) ? value.quote : {};
  const usd = isRecord(quote.USD) ? quote.USD : {};
  const usdQuote: CmcListingQuote = {
    price: num(usd.price),
    volume_24h: num(usd.volume_24h),
    cex_volume_24h: num(usd.cex_volume_24h),
    dex_volume_24h: num(usd.dex_volume_24h),
    percent_change_1h: num(usd.percent_change_1h),
    percent_change_24h: num(usd.percent_change_24h),
    percent_change_7d: num(usd.percent_change_7d),
    percent_change_30d: num(usd.percent_change_30d),
    percent_change_60d: num(usd.percent_change_60d),
    percent_change_90d: num(usd.percent_change_90d),
    market_cap: num(usd.market_cap),
    fully_diluted_market_cap: num(usd.fully_diluted_market_cap),
    market_cap_dominance: num(usd.market_cap_dominance),
    last_updated: str(usd.last_updated),
  };
  const platform = isRecord(value.platform)
    ? {
        id: num(value.platform.id) ?? 0,
        name: str(value.platform.name) ?? "",
        symbol: str(value.platform.symbol) ?? "",
        slug: str(value.platform.slug) ?? "",
      }
    : null;
  const tags = Array.isArray(value.tags)
    ? value.tags.filter((t): t is string => typeof t === "string")
    : [];
  return {
    id: value.id,
    name: str(value.name) ?? value.symbol,
    symbol: value.symbol,
    slug: str(value.slug) ?? value.symbol.toLowerCase(),
    infinite_supply: value.infinite_supply === true,
    circulating_supply: num(value.circulating_supply),
    total_supply: num(value.total_supply),
    max_supply: num(value.max_supply),
    date_added: str(value.date_added) ?? "",
    num_market_pairs: num(value.num_market_pairs),
    cmc_rank: num(value.cmc_rank),
    last_updated: str(value.last_updated) ?? "",
    platform,
    self_reported_circulating_supply: num(value.self_reported_circulating_supply),
    self_reported_market_cap: num(value.self_reported_market_cap),
    minted_market_cap: num(value.minted_market_cap),
    quote: { USD: usdQuote },
    tags,
  };
}

export function parseHistoricalPoint(value: unknown): CmcHistoricalQuote | null {
  if (!isRecord(value) || typeof value.timestamp !== "string") return null;
  const quote = isRecord(value.quote) ? value.quote : {};
  const usd = isRecord(quote.USD) ? quote.USD : {};
  const price = num(usd.price);
  const volume = num(usd.volume_24h);
  if (price === null || !(price > 0)) return null;
  return {
    timestamp: value.timestamp,
    quote: {
      USD: {
        price,
        volume_24h: volume,
        market_cap: num(usd.market_cap),
        circulating_supply: num(usd.circulating_supply),
        total_supply: num(usd.total_supply),
        timestamp: str(usd.timestamp) ?? value.timestamp,
      },
    },
  };
}

export function parseHistoricalSeries(value: unknown): CmcHistoricalSeries | null {
  if (!isRecord(value) || typeof value.id !== "number") return null;
  const quotes = Array.isArray(value.quotes)
    ? value.quotes
        .map(parseHistoricalPoint)
        .filter((q): q is CmcHistoricalQuote => q !== null)
    : [];
  return {
    id: value.id,
    name: str(value.name) ?? "",
    symbol: str(value.symbol) ?? "",
    is_active: num(value.is_active) ?? 0,
    quotes,
  };
}

export function parseFearGreed(value: unknown): CmcFearGreedPoint | null {
  if (!isRecord(value)) return null;
  const val = num(value.value);
  const ts = str(value.timestamp);
  if (val === null || ts === null) return null;
  return {
    timestamp: ts,
    value: val,
    value_classification: str(value.value_classification) ?? "",
  };
}

/* ------------------------------------------------------------------ *
 * 3. Computed domain model (what the UI renders)
 * ------------------------------------------------------------------ */

/** One bucket of the volume-by-price profile. */
export interface ProfileBucket {
  /** Representative mid-price of the bucket. */
  price: number;
  /** Traded USD volume that changed hands inside this price bucket. */
  volume: number;
}

export interface AssetStats {
  id: number;
  symbol: string;
  name: string;
  slug: string;
  rank: number;
  sector: Sector;
  isStable: boolean;
  /** Latest USD price. */
  price: number;
  marketCap: number;
  volume24h: number;
  /** Trailing-window volume-weighted average price (proxy for cost basis). */
  vwap: number;
  /** price / vwap - 1, as a fraction. */
  priceVsVwap: number;
  /**
   * Share (0..1) of the trailing window's traded volume that changed hands at a
   * price above today's price. The headline "underwater supply" metric.
   */
  underwater: number;
  /**
   * Volume-weighted average loss (0..1) borne by the underwater portion. Only
   * defined when `underwater > 0`.
   */
  painDepth: number;
  underwaterVolume: number;
  profitVolume: number;
  /** Number of daily observations behind the metric (data quality flag). */
  points: number;
  /** Daily price sparkline, downsampled to <= 60 points. */
  priceSeries: number[];
  /** Daily cost-basis (VWAP) sparkline, downsampled to match priceSeries. */
  vwapSeries: number[];
  /** Volume-by-price histogram across the trailing window. */
  profile: ProfileBucket[];
}

export interface MarketPoint {
  /** ISO date. */
  t: string;
  /** Volume-weighted market underwater share at this date (0..1). */
  underwater: number;
  /** Share of the (priced) universe trading below its cost basis (0..1). */
  breadth: number;
  /** Fear & Greed value at this date (0..100), when available. */
  fng: number | null;
}

export interface SectorSummary {
  sector: Sector;
  count: number;
  marketCap: number;
  underwater: number;
}

export interface Dataset {
  /** ISO timestamp the payload was assembled. */
  generatedAt: string;
  /** `live` when fetched from the API this run, `snapshot` when bundled. */
  source: "live" | "snapshot";
  /** ISO timestamp of the newest quote in the payload. */
  asOf: string;
  /** Human-readable trailing window, e.g. "365d". */
  window: string;
  universe: number;
  assets: AssetStats[];
  marketSeries: MarketPoint[];
  sectors: SectorSummary[];
  market: {
    /** Volume-weighted market underwater share (the signature number). */
    underwater: number;
    /** Traded USD volume represented in the calculation. */
    volume: number;
    /** Share of the universe below its cost basis. */
    breadth: number;
    /** Fear & Greed latest, when available. */
    fng: number | null;
    fngLabel: string | null;
    /** Total market cap of the universe. */
    marketCap: number;
  };
  /** Non-fatal warnings surfaced to the UI (rate limits, dropped assets, ...). */
  warnings: string[];
  /** Market-wide context from `/global-metrics/quotes/latest`, when available. */
  context?: {
    totalMarketCap: number;
    btcDominance: number | null;
    altcoinMarketCap: number | null;
  };
}

/** Coarse sector taxonomy derived from CMC tags. */
export const SECTORS = [
  "Stablecoin",
  "AI & Big Data",
  "DeFi",
  "Layer 1",
  "Layer 2",
  "Memes",
  "Real World Assets",
  "Gaming",
  "Privacy",
  "Infrastructure",
  "Other",
] as const;

export type Sector = (typeof SECTORS)[number];

/* ------------------------------------------------------------------ *
 * 4. Serialization boundary
 * ------------------------------------------------------------------ */

/**
 * The heavy per-asset arrays (`priceSeries`, `vwapSeries`, `profile`) are
 * dropped before crossing the server→client boundary and fetched on demand by
 * the asset drawer. Keeps the RSC payload small.
 */
export type SlimAsset = Omit<AssetStats, "priceSeries" | "vwapSeries" | "profile">;

export interface SlimDataset extends Omit<Dataset, "assets"> {
  assets: SlimAsset[];
}

/** Asset payload returned by `/api/asset`. */
export interface AssetDetail {
  asset: AssetStats;
  peer: AssetStats[];
}

