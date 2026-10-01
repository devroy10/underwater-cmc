"use client";

import { useState } from "react";
import { pct, signedPct, underwaterColor, usdExact } from "@/lib/format";
import { useAssetSelection } from "@/lib/dashboard/state";
import { useAssetDetail } from "@/lib/dashboard/queries";
import { useIsMobile } from "@/hooks/use-mobile";
import { TokenLogo } from "@/components/dashboard/token-logo";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Sparkline, VolumeProfile } from "./charts";
import {
  Legend,
  LegendItem,
  LegendLabel,
  LegendMarker,
} from "@/components/charts/legend";

export function AssetDrawer() {
  const isMobile = useIsMobile();
  const { selectedId, select } = useAssetSelection();
  const { data, isLoading, isError } = useAssetDetail(selectedId);
  const [copied, setCopied] = useState(false);

  const asset = data?.asset;
  const open = selectedId !== null;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/dashboard?asset=${selectedId}`,
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  const body = (
    <div className="flex flex-col gap-5 px-4 pb-6">
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={copyLink} disabled={!asset}>
          {copied ? "Copied" : "Copy link"}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : null}

      {isError ? (
        <p className="text-sm text-destructive">Could not load this asset.</p>
      ) : null}

      {asset ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Underwater" value={pct(asset.underwater)} tone="underwater" />
            <Stat label="vs cost basis" value={signedPct(asset.priceVsVwap, 1)} />
            <Stat label="Trailing cost basis" value={usdExact(asset.vwap)} />
            <Stat label="Price" value={usdExact(asset.price)} />
            <Stat label="Pain depth" value={pct(asset.painDepth, 1)} />
            <Stat label="Rank" value={`#${asset.rank}`} />
          </div>

          <p className="border bg-muted/40 p-3 text-sm leading-relaxed text-muted-foreground">
            {pct(asset.underwater)} of the last year&apos;s traded volume changed hands above{" "}
            <span className="tabular text-foreground">{usdExact(asset.price)}</span>. Those buyers
            hold an average loss of{" "}
            <span className="tabular text-foreground">{pct(asset.painDepth, 1)}</span>.
          </p>

          <section>
            <h3 className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
              Price vs cost basis (12m)
            </h3>
            <Sparkline
              price={asset.priceSeries}
              vwap={asset.vwapSeries}
              color={underwaterColor(asset.underwater)}
            />
            <Legend
              items={[
                { label: "Price", value: 0, color: underwaterColor(asset.underwater) },
                { label: "Cost basis", value: 0, color: "var(--cost)" },
              ]}
              className="mt-2 flex-row flex-wrap gap-x-4 gap-y-1"
            >
              <LegendItem className="flex items-center gap-1.5 px-1 py-0.5">
                <LegendMarker className="h-2 w-2" />
                <LegendLabel className="text-[11px] font-medium" />
              </LegendItem>
            </Legend>
          </section>

          <Separator />

          <section>
            <h3 className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
              Where the volume traded
            </h3>
            <VolumeProfile buckets={asset.profile} price={asset.price} vwap={asset.vwap} />
          </section>

          {data && data.peer.length > 0 ? (
            <>
              <Separator />
              <section>
                <h3 className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                  Same sector · {asset.sector}
                </h3>
                <ul className="flex flex-col gap-1.5">
                  {data.peer.map((peer) => (
                    <li key={peer.id}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-between"
                        onClick={() => select(peer.id)}
                      >
                        <span className="flex items-center gap-2">
                          <TokenLogo id={peer.id} symbol={peer.symbol} size={16} />
                          {peer.symbol}
                        </span>
                        <span className="tabular text-muted-foreground">{pct(peer.underwater)}</span>
                      </Button>
                    </li>
                  ))}
                </ul>
              </section>
            </>
          ) : null}
        </>
      ) : null}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer
        open={open}
        onOpenChange={(next) => {
          if (!next) select(null);
        }}
        swipeDirection="down"
        showSwipeHandle
      >
        <DrawerContent>
          <DrawerHeader>
            <div className="flex items-center gap-2">
              {asset ? (
                <TokenLogo id={asset.id} symbol={asset.symbol} size={28} />
              ) : (
                <Skeleton className="size-7 rounded-full" />
              )}
              <DrawerTitle>{asset?.symbol ?? "Asset"}</DrawerTitle>
            </div>
            <DrawerDescription>{asset?.name ?? "Loading"}</DrawerDescription>
          </DrawerHeader>
          <div className="min-h-0 flex-1 overflow-y-auto">{body}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) select(null);
      }}
    >
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <div className="flex items-center gap-2">
            {asset ? (
              <TokenLogo id={asset.id} symbol={asset.symbol} size={28} />
            ) : (
              <Skeleton className="size-7 rounded-full" />
            )}
            <SheetTitle>{asset?.symbol ?? "Asset"}</SheetTitle>
          </div>
          <SheetDescription>{asset?.name ?? "Loading"}</SheetDescription>
        </SheetHeader>
        {body}
      </SheetContent>
    </Sheet>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "underwater" }) {
  return (
    <div className="border bg-card p-3">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div
        className={
          tone === "underwater"
            ? "tabular mt-1 text-lg text-underwater"
            : "tabular mt-1 text-lg text-foreground"
        }
      >
        {value}
      </div>
    </div>
  );
}
