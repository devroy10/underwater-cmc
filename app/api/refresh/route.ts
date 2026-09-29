import { NextResponse } from "next/server";
import { getApiKey } from "@/lib/cmc";
import { buildLiveDataset } from "@/lib/dataset";
import { toSlim } from "@/lib/underwater";

/**
 * Live refresh: pulls a smaller (80-asset) universe straight from the CMC API,
 * runs the same engine, and returns a slim dataset. The bundled snapshot is the
 * fallback, so a failure here never breaks the demo.
 */
export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(): Promise<NextResponse> {
  if (!getApiKey()) {
    return NextResponse.json(
      { error: "CMC_API_KEY is not configured on the server." },
      { status: 503 },
    );
  }
  try {
    const started = Date.now();
    const { dataset, credits, errors } = await buildLiveDataset({ universe: 80, windowDays: 365 });
    return NextResponse.json({
      dataset: toSlim(dataset),
      credits,
      errors,
      elapsedMs: Date.now() - started,
      source: "live",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "refresh failed" },
      { status: 502 },
    );
  }
}
