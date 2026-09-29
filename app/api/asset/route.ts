import { NextResponse } from "next/server";
import { getSnapshot } from "@/lib/dataset";
import type { AssetDetail } from "@/lib/types";

/**
 * Full per-asset detail (including the heavy volume profile + sparkline arrays)
 * fetched on demand when a drawer opens, so the initial RSC payload stays slim.
 */
export function GET(request: Request): NextResponse {
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "numeric id required" }, { status: 400 });
  }
  const dataset = getSnapshot();
  const asset = dataset.assets.find((a) => a.id === id);
  if (!asset) {
    return NextResponse.json({ error: "asset not found" }, { status: 404 });
  }
  const peer = dataset.assets
    .filter((a) => a.sector === asset.sector && a.id !== asset.id && !a.isStable)
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 6);
  const payload: AssetDetail = { asset, peer };
  return NextResponse.json(payload);
}
