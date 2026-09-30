# API feedback

What worked, and where the CoinMarketCap API got in the way while building
UNDERWATER. Everything below was reproduced live on the hackathon (Startup)
key.

## Worked well

- **`quotes/historical` with `id=a,b,c`**: batched, aligned daily series across
  many assets with one request per 20. This single design choice is what makes a
  market-wide cost-basis reconstruction possible without any on-chain infra.
- **Rich `listings/latest` rows**: `tags`, the `cex_volume_24h`/`dex_volume_24h`
  split, `fully_diluted_market_cap` and `minted_market_cap` are far more than a
  price endpoint usually returns.
- **`/v3/fear-and-greed/historical`**: 400 days of sentiment, cheap (1 credit),
  and undocumented in the obvious place. A quiet gem.

## Friction

### 1. History is capped at 12 months
`quotes/historical` with `time_start` older than a year returns:

```
400: Your plan allows 12 months of historical access. Please upgrade your plan
or choose a startDate that is newer than 2025-09-28T...
```

A cost-basis metric wants a full cycle (>= 3 to 4 years) to be trustworthy. The cap
makes the "underwater" number regime-dependent. A 24-month window even on the
Startup tier would materially improve the product.

### 2. `quotes/historical` is billed per returned row
A 200-asset universe costs **715 credits** because cost scales with rows, not
requests. There is no "return an aligned matrix" or bulk-export mode. For a
market-wide study this pushes you toward either a small universe or credit
maths. A flat per-request price (or a cheaper "daily closes only" projection)
would unlock class-of-2024-style analyses.

### 3. There is no realised cost basis or holder cohort field
The single most requested primitive for this project: any of
`realized_cap`, `average_cost_basis`, `% supply in profit`, or holder-cohort
buckets. It forces everyone onto a VWAP proxy. If even a coarse
`realized_price` (last-moved price) were exposed, "underwater" would become
ground truth instead of an estimate.

### 4. `listing_status=inactive` appears to be ignored
`/v1/cryptocurrency/listings/latest?listing_status=inactive` returned **BTC,
ETH, USDT, …**: the active set, not delisted assets. I could not build
survivorship / token-mortality analysis. Either the filter is a no-op on this
plan or the parameter name has changed; the docs still list it.

```bash
curl ".../v1/cryptocurrency/listings/latest?listing_status=inactive&limit=5"
# -> BTC, ETH, USDT ... (all active)
```

### 5. Suggested endpoints are not on the suggested plan
The hackathon brief points at OHLCV, derivatives and exchange data, but on the
provided tier these return `403: Your API Key subscription plan doesn't support
this endpoint`:

`/v1/cryptocurrency/trending/*`, `/v1/cryptocurrency/market-pairs/*`,
`/v1/cryptocurrency/ohlcv/*`, `/v1/cryptocurrency/listings/new`,
`/v1/exchange/listings/*`, `/v1/exchange/quotes/*`, `/v1/derivatives/*`,
`/v1/community/*`.

That is a mismatch worth fixing for future hackathons: either enable a read-only
slice of these for participants, or update the track copy so people don't design
around endpoints they cannot call.

### 6. RWA `market-pairs` is gated despite the docs
`/v5/real-world-assets/market-pairs/list` returns 403, while the RWA reference
page lists it as available on Basic. Everything else under
`/v5/real-world-assets/*` worked (`map`, `info`, `assets/list`, `quotes/latest`,
`issuers/list`, `issuers`).

### 7. MCP: `tools/list` works, `tools/call` does not
`https://mcp.coinmarketcap.com/mcp` returns the full tool catalogue
(`trending_crypto_narratives`, `get_crypto_metrics`, `find_skill`, …) for any
caller, but `tools/call` returns `{"result":{"content":[{"text":"error: Token
not found"}]}}` with the same `X-CMC_PRO_API_KEY` (tried header, Bearer and
query forms). If tool calls are meant to work with a Pro key, the docs could say
which token is expected.

### 8. Small gaps that block obvious features
- `global-metrics/quotes/historical` omits `stablecoin_market_cap` (only
  `latest` has it), so "stablecoin dry powder over time" can't be charted.
- `listings/historical` (rank snapshots by date) 400s on this plan, so rank-churn
  / index-turnover studies aren't possible.
- `categories` is a current snapshot only, with no history, so a narrative-rotation
  chart has to be reconstructed from per-coin history.
- `self_reported_circulating_supply` is null for ~31% of the top 500, limiting
  supply-integrity checks.

## The one-line ask

**A `realized_price` / cost-basis field on `/quotes/historical`, and 24 months of
history on the Startup tier.** Those two changes turn UNDERWATER from a clever
proxy into a definitive metric.
