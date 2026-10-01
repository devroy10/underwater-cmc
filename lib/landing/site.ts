import type { Metadata } from "next";

const origin =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");
const name = "Underwater";
const title = "Underwater | The true cost-basis index";
const description =
  "See how much of the crypto market's traded supply sits underwater before price can move.";

export const metadata: Metadata = {
  metadataBase: new URL(origin),
  title: {
    default: title,
    template: `%s · ${name}`,
  },
  description,
  creator: name,
  icons: {
    icon: [
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-touch-icon.png", type: "image/png", sizes: "180x180" }],
  },
  openGraph: {
    title,
    description,
    url: origin,
    siteName: name,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: name }],
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: { url: "/og.png", width: 1200, height: 630, alt: name },
  },
};
