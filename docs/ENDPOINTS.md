# Endpoints used

All calls are `GET` against `https://pro-api.coinmarketcap.com` with the
`X-CMC_PRO_API_KEY` header. Credit costs are as observed on the hackathon
(Startup) plan.

---

## 1. `/v1/cryptocurrency/listings/latest`

**Purpose:** the universe — identity, current quote, tags, volumes.

**Parameters used:** `limit=200`, `start=1`, `sort=market_cap`,
`sort_dir=desc`, `cryptocurrency_type=all`.

**Cost:** 1 credit + 1 per 200 rows.

```bash
curl "https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?limit=200&sort=market_cap&sort_dir=desc" \
  --header "X-CMC_PRO_API_KEY: $CMC_API_KEY"
```

**Fields consumed:** `id`, `symbol`, `name`, `slug`, `cmc_rank`, `tags`,
`platform`, `date_added`, supply fields, `quote.USD.{price,volume_24h,market_cap,
cex_volume_24h,dex_volume_24h,percent_change_*}`.

**Used for:** universe selection, sector classification (from `tags`), current
price, market cap and the total traded volume weight.

Sample: [`../evidence/listings.sample.json`](../evidence/listings.sample.json).

---

## 2. `/v1/cryptocurrency/quotes/historical`

**Purpose:** the core input — a daily price + volume series per asset.

**Parameters used:** `id=a,b,c,...` (up to 20 per call), `interval=daily`,
`count=365`.

**Cost:** billed per returned row (≈ 3.6 credits/asset for 365 daily points;
715 credits for the 200-asset build).

```bash
curl "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/historical?id=1,1027&interval=daily&count=365" \
  --header "X-CMC_PRO_API_KEY: $CMC_API_KEY"
```

**Fields consumed:** `quotes[].timestamp`, `quotes[].quote.USD.{price,volume_24h}`.

**Used for:** cost basis (VWAP), underwater share, pain depth, volume-by-price
profile, price-vs-cost-basis sparkline, and the market time series.

> The plan limits `time_start` to the last 12 months. `count=365` daily points
> is the maximum window; a wider `time_start` returns
> `"Your plan allows 12 months of historical access."`

---

## 3. `/v3/fear-and-greed/historical`

**Purpose:** sentiment overlay on the market index.

**Parameters used:** `limit=365`.

**Cost:** 1 credit.

```bash
curl "https://pro-api.coinmarketcap.com/v3/fear-and-greed/historical?limit=365" \
  --header "X-CMC_PRO_API_KEY: $CMC_API_KEY"
```

**Fields consumed:** `timestamp` (seconds), `value`, `value_classification`.

Sample: [`../evidence/fear-greed.sample.json`](../evidence/fear-greed.sample.json).

---

## 4. `/v1/global-metrics/quotes/latest`

**Purpose:** market-wide context in the header (total market cap, BTC
dominance).

**Parameters used:** none.

**Cost:** 1 credit.

```bash
curl "https://pro-api.coinmarketcap.com/v1/global-metrics/quotes/latest" \
  --header "X-CMC_PRO_API_KEY: $CMC_API_KEY"
```

**Fields consumed:** `quote.USD.total_market_cap`, `btc_dominance`,
`quote.USD.altcoin_market_cap`.

Sample: [`../evidence/global.sample.json`](../evidence/global.sample.json).

---

## Weekly build cost

`npm run build:dataset` (universe 200, window 365d): **≈ 715 credits, ≈ 27s**.
The live refresh button uses an 80-asset universe: **≈ 294 credits, ≈ 14s**.
