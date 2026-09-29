/**
 * CoinMarketCap REST client (server-only).
 *
 * Design notes:
 *  - Never imported from a client component; the API key stays on the server.
 *  - One generic `request()` handles auth, retries, rate limiting and envelope
 *    parsing, so every endpoint function is a thin typed wrapper.
 *  - Endpoint credit costs and plan limits are real (50 req/min, 15k/mo on the
 *    hackathon plan), so batching + a sliding-window limiter are built in.
 */

import {
  type CmcCategory,
  type CmcFearGreedPoint,
  type CmcGlobalHistoricalPoint,
  type CmcGlobalLatest,
  type CmcHistoricalSeries,
  type CmcListing,
  type CmcResult,
  type CmcStatus,
  parseEnvelope,
  parseFearGreed,
  parseHistoricalSeries,
  parseListing,
} from "./types";

const BASE = "https://pro-api.coinmarketcap.com";

/** Sliding-window limiter: the plan allows 50 requests per minute. */
const MAX_REQUESTS_PER_MINUTE = 45; // headroom under the documented 50
const requestTimes: number[] = [];

async function throttle(): Promise<void> {
  for (;;) {
    const now = Date.now();
    while (requestTimes.length > 0 && now - requestTimes[0] > 60_000) {
      requestTimes.shift();
    }
    if (requestTimes.length < MAX_REQUESTS_PER_MINUTE) {
      requestTimes.push(now);
      return;
    }
    const waitMs = 60_000 - (now - requestTimes[0]) + 50;
    await sleep(waitMs);
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getApiKey(): string | null {
  const key = process.env.CMC_API_KEY;
  return key && key.trim().length > 0 ? key.trim() : null;
}

interface RequestOptions {
  /** Retries on 429/5xx. */
  retries?: number;
}

/**
 * Perform one authenticated GET and normalise the transport into a
 * `CmcResult`. `parse` receives the already-unwrapped `data` node.
 */
async function request<T>(
  path: string,
  params: Record<string, string | number>,
  parse: (data: unknown, status: CmcStatus) => T,
  { retries = 3 }: RequestOptions = {},
): Promise<CmcResult<T>> {
  const key = getApiKey();
  if (!key) {
    return {
      ok: false,
      httpStatus: 401,
      errorCode: 1002,
      message:
        "Missing CMC_API_KEY. The live path is disabled; serving the bundled snapshot.",
    };
  }

  const url = new URL(path, BASE);
  for (const [name, value] of Object.entries(params)) {
    url.searchParams.set(name, String(value));
  }

  let lastError = "Unknown error";

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    await throttle();
    let response: Response;
    try {
      response = await fetch(url, {
        headers: { "X-CMC_PRO_API_KEY": key, Accept: "application/json" },
        // We cache the assembled dataset ourselves (bundled snapshot + refresh
        // endpoint); per-fetch caching would only add latency and >2MB warnings.
        cache: "no-store",
      });
    } catch (cause) {
      lastError = cause instanceof Error ? cause.message : String(cause);
      await sleep(backoff(attempt));
      continue;
    }

    const body: unknown = await response.json().catch(() => null);
    const envelope = parseEnvelope(body);

    if (!envelope) {
      lastError = `Malformed response (HTTP ${response.status})`;
      if (response.status === 429 || response.status >= 500) {
        await sleep(backoff(attempt));
        continue;
      }
      return { ok: false, httpStatus: response.status, errorCode: response.status, message: lastError };
    }

    const { data, status } = envelope;
    const errorCode = status.error_code;
    const isError = !(errorCode === 0 || errorCode === "0");

    if (!isError) {
      return { ok: true, data: parse(data, status), credits: status.credit_count, status };
    }

    lastError = status.error_message ?? "CMC returned an error";
    const retryable =
      Number(errorCode) === 429 || Number(errorCode) >= 500 || response.status === 429;
    if (retryable && attempt < retries) {
      await sleep(backoff(attempt));
      continue;
    }
    return {
      ok: false,
      httpStatus: response.status,
      errorCode,
      message: `${errorCode}: ${lastError}`,
    };
  }

  return { ok: false, httpStatus: 0, errorCode: "network", message: lastError };
}

function backoff(attempt: number): number {
  return Math.min(8_000, 500 * 2 ** attempt);
}

/* ------------------------------------------------------------------ *
 * Endpoint wrappers
 * ------------------------------------------------------------------ */

export function fetchListings(
  limit: number,
  start = 1,
): Promise<CmcResult<CmcListing[]>> {
  return request(
    "/v1/cryptocurrency/listings/latest",
    { limit, start, sort: "market_cap", sort_dir: "desc", cryptocurrency_type: "all" },
    (data) => {
      if (!Array.isArray(data)) return [];
      return data.map(parseListing).filter((row): row is CmcListing => row !== null);
    },
  );
}

/**
 * Daily history for many assets. The API accepts a comma-separated id list, so
 * we chunk (default 20 ids/request) to keep responses bounded while staying far
 * inside the 50 req/min limiter.
 */
export async function fetchHistoryBatch(
  ids: number[],
  interval: string,
  count: number,
  chunkSize = 20,
): Promise<{ series: CmcHistoricalSeries[]; credits: number; errors: string[] }> {
  const series: CmcHistoricalSeries[] = [];
  const errors: string[] = [];
  let credits = 0;

  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    const result = await request(
      "/v1/cryptocurrency/quotes/historical",
      { id: chunk.join(","), interval, count },
      (data) => {
        const out: CmcHistoricalSeries[] = [];
        if (Array.isArray(data)) {
          for (const row of data) {
            const parsed = parseHistoricalSeries(row);
            if (parsed) out.push(parsed);
          }
        } else if (data && typeof data === "object") {
          for (const value of Object.values(data as Record<string, unknown>)) {
            const parsed = parseHistoricalSeries(value);
            if (parsed) out.push(parsed);
          }
        }
        return out;
      },
    );
    if (result.ok) {
      credits += result.credits;
      series.push(...result.data);
    } else {
      errors.push(`history chunk ${i / chunkSize + 1}: ${result.message}`);
    }
  }

  return { series, credits, errors };
}

export function fetchGlobalLatest(): Promise<CmcResult<CmcGlobalLatest>> {
  return request(
    "/v1/global-metrics/quotes/latest",
    {},
    (data) => data as CmcGlobalLatest,
  );
}

export function fetchGlobalHistorical(
  interval: string,
  count: number,
): Promise<CmcResult<CmcGlobalHistoricalPoint[]>> {
  return request(
    "/v1/global-metrics/quotes/historical",
    { interval, count },
    (data) => {
      if (!data || typeof data !== "object") return [];
      const quotes = (data as { quotes?: unknown }).quotes;
      if (!Array.isArray(quotes)) return [];
      return quotes as CmcGlobalHistoricalPoint[];
    },
  );
}

export function fetchFearGreed(limit: number): Promise<CmcResult<CmcFearGreedPoint[]>> {
  return request(
    "/v3/fear-and-greed/historical",
    { limit },
    (data) => {
      if (!Array.isArray(data)) return [];
      return data.map(parseFearGreed).filter((p): p is CmcFearGreedPoint => p !== null);
    },
  );
}

export function fetchCategories(limit: number): Promise<CmcResult<CmcCategory[]>> {
  return request(
    "/v1/cryptocurrency/categories",
    { limit },
    (data) => (Array.isArray(data) ? (data as CmcCategory[]) : []),
  );
}
