import { NextResponse } from "next/server";
import { pct, usd } from "@/lib/format";

/**
 * Optional "analyst read": a short, grounded interpretation of the current
 * numbers via Gemini. The model is given ONLY the computed figures and told to
 * avoid advice/hype, so it annotates the data rather than inventing it.
 */
export const runtime = "nodejs";
export const maxDuration = 30;

interface Summary {
  underwater: number;
  breadth: number;
  volume: number;
  fng: number | null;
  window: string;
  trapped: Array<{ symbol: string; underwater: number; vsCostBasis: number }>;
  clean: Array<{ symbol: string; underwater: number; vsCostBasis: number }>;
}

function isSummary(value: unknown): value is Summary {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.underwater === "number" &&
    typeof v.breadth === "number" &&
    typeof v.volume === "number" &&
    typeof v.window === "string" &&
    Array.isArray(v.trapped) &&
    Array.isArray(v.clean)
  );
}

export async function POST(request: Request): Promise<NextResponse> {
  const key = process.env.GOOGLE_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "GOOGLE_API_KEY is not configured." }, { status: 503 });
  }

  const body: unknown = await request.json().catch(() => null);
  if (!isSummary(body)) {
    return NextResponse.json({ error: "invalid summary payload" }, { status: 400 });
  }

  const trapped = body.trapped
    .slice(0, 5)
    .map((t) => `${t.symbol} (${pct(t.underwater)}, ${pct(t.vsCostBasis, 1)} vs cost basis)`)
    .join("; ");
  const clean = body.clean
    .slice(0, 5)
    .map((t) => `${t.symbol} (${pct(t.underwater)})`)
    .join("; ");

  const prompt = [
    "You are a precise crypto market analyst. Using ONLY the figures below, write at most 3 sentences.",
    "Cite specific numbers. Do not give investment advice, price predictions, or hype. Note uncertainty where it exists.",
    "",
    `Window: trailing ${body.window}.`,
    `Market underwater supply: ${pct(body.underwater)} of ${usd(body.volume)} traded volume.`,
    `Universe breadth below cost basis: ${pct(body.breadth)}.`,
    `Fear & Greed: ${body.fng ?? "n/a"}.`,
    `Most trapped (symbol, underwater, vs cost basis): ${trapped}.`,
    `Cleanest air (symbol, underwater): ${clean}.`,
    "",
    "Explain what this aggregate cost-basis picture implies about latent sell pressure, with one caveat about the VWAP proxy.",
  ].join("\n");

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.6,
            maxOutputTokens: 512,
            // Keep latency/cost low: this is a short annotation, not a reasoning task.
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
      },
    );
    const json: unknown = await response.json();
    const text = extractText(json);
    if (!text) {
      return NextResponse.json({ error: "model returned no text" }, { status: 502 });
    }
    return NextResponse.json({ text });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "analyst call failed" },
      { status: 502 },
    );
  }
}

function extractText(json: unknown): string | null {
  if (typeof json !== "object" || json === null) return null;
  const candidates = (json as { candidates?: unknown }).candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) return null;
  const content = (candidates[0] as { content?: { parts?: unknown } }).content;
  const parts = content?.parts;
  if (!Array.isArray(parts)) return null;
  const chunks: string[] = [];
  for (const part of parts) {
    if (typeof part !== "object" || part === null) continue;
    const p = part as { text?: unknown; thought?: unknown };
    if (p.thought === true) continue;
    if (typeof p.text === "string") chunks.push(p.text);
  }
  return chunks.join("").trim() || null;
}
