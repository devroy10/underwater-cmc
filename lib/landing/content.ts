import type { DeveloperItem, Feature, Finding, Stat } from "./types";

// Imagery is placeholder and is replaced during the visual tuning pass.

export const marqueeItems: readonly string[] = [
  "Top 200 assets",
  "365 days of price and volume",
  "Live CoinMarketCap API",
  "Cost-basis map",
  "Volume-by-price profile",
  "Fear and Greed overlay",
  "Portfolio overlay",
] as const;

export const features: readonly Feature[] = [
  {
    title: "Market Underwater Index",
    description:
      "One trailing oscillator for the whole market. It tracks the share of traded volume sitting below today's price, with a breadth line and a Fear and Greed overlay.",
    span: 2,
  },
  {
    title: "Cost-basis map",
    description:
      "Every asset placed by price against cost basis, and by how much of its volume is underwater.",
    span: 1,
  },
  {
    title: "Asset explorer",
    description: "Search, filter, and sort the universe by underwater supply.",
    span: 1,
  },
  {
    title: "Volume-by-price profile",
    description:
      "Open any asset to see exactly where the year's volume traded, plotted against the current price.",
    span: 2,
  },
  {
    title: "Portfolio overlay",
    description:
      "Paste a portfolio and read its value-weighted cost basis, plus where the pain is concentrated.",
    image: "/images/features/feature-05.png",
    span: 1,
  },
  {
    title: "Live refresh",
    description:
      "Pull a fresh universe straight from the CoinMarketCap API.",
    image: "/images/features/feature-06.png",
    span: 1,
  },
  {
    title: "Shareable views",
    description:
      "Every asset has a deep link, so you can send one chart or your whole view.",
    image: "/images/features/feature-07.png",
    span: 1,
  },
] as const;

export const stats: readonly Stat[] = [
  { value: "50%", label: "of $33.3T traded volume underwater" },
  { value: "73%", label: "of the universe below cost basis" },
  { value: "200", label: "assets tracked" },
  { value: "365", label: "days of price and volume" },
] as const;

export const mobileStats: readonly Stat[] = [
  { value: "50%", label: "of traded volume underwater" },
  { value: "73%", label: "below cost basis" },
  { value: "200", label: "assets tracked" },
  { value: "365", label: "days of history" },
] as const;

export const findings: readonly Finding[] = [
  {
    title:
      "Privacy and Gaming carry the heaviest overhang, at 84% and 78% underwater.",
  },
  {
    title: "ZEC and HYPE trade above almost all of the year's cost basis.",
  },
  {
    title: "DOGE holders sit on an average loss of 31%.",
  },
  {
    title:
      "Half of a year of traded volume is trapped, and that is latent sell pressure.",
  },
] as const;

export const developerItems: readonly DeveloperItem[] = [
  {
    title: "Cost basis, not guesswork",
    description:
      "Volume-weighted average price over 365 days, computed for every asset.",
    image: "/images/dev-01.png",
  },
  {
    title: "Transparent method",
    description:
      "Every metric is defined in the app, and the VWAP proxy is stated outright.",
    image: "/images/dev-02.png",
  },
  {
    title: "Live from the API",
    description:
      "Refresh pulls a fresh universe straight from CoinMarketCap.",
    image: "/images/dev-03.png",
  },
  {
    title: "Traceable numbers",
    description:
      "Raw API responses ship next to the figures they produce.",
    image: "/images/dev-04.png",
  },
] as const;
