"use client";

import { useMemo } from "react";
import { ActivityIcon, CoinsIcon, LayersIcon, SparklesIcon, WavesIcon } from "lucide-react";
import { pct, usd } from "@/lib/format";
import { useAnalystRead, type AnalystSummary } from "@/lib/dashboard/queries";
import { useDatasetContext } from "./dataset-provider";
import { MarketIndexChart, SectorBarChart, UnderwaterRing } from "./charts";
import { KpiCard } from "./kpi-card";
import { PageHeader } from "./page-header";
import { Leaderboards } from "@/components/panels";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

export function OverviewView() {
  const { dataset } = useDatasetContext();
  const analyst = useAnalystRead();
  const { market } = dataset;

  const summary = useMemo<AnalystSummary>(() => {
    const ranked = dataset.assets.filter((a) => !a.isStable);
    const toItem = (a: (typeof ranked)[number]) => ({
      symbol: a.symbol,
      underwater: a.underwater,
      vsCostBasis: a.priceVsVwap,
    });
    return {
      underwater: market.underwater,
      breadth: market.breadth,
      volume: market.volume,
      fng: market.fng,
      window: dataset.window,
      trapped: [...ranked].sort((a, b) => b.underwater - a.underwater).slice(0, 5).map(toItem),
      clean: [...ranked].sort((a, b) => a.underwater - b.underwater).slice(0, 5).map(toItem),
    };
  }, [dataset, market]);

  return (
    <>
      <PageHeader
        title="Overview"
        description="The market's aggregate cost basis. How much of the past year's traded supply is under water, and where it sits."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={WavesIcon}
          label="Market underwater"
          value={pct(market.underwater)}
          sub={`of ${usd(market.volume)} traded`}
          tone="underwater"
        />
        <KpiCard
          icon={ActivityIcon}
          label="Universe breadth"
          value={pct(market.breadth)}
          sub="below cost basis"
        />
        <KpiCard
          icon={LayersIcon}
          label="Assets tracked"
          value={String(dataset.assets.length)}
          sub={`${dataset.window} window`}
        />
        <KpiCard
          icon={CoinsIcon}
          label="Market cap"
          value={usd(dataset.context?.totalMarketCap ?? market.marketCap)}
          sub={
            dataset.context?.btcDominance
              ? `BTC.D ${dataset.context.btcDominance.toFixed(1)}%`
              : "tracked universe"
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Market underwater index</CardTitle>
            <CardDescription>
              Share of trailing traded volume below today&apos;s price, with the breadth line
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MarketIndexChart series={dataset.marketSeries} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Supply under water</CardTitle>
            <CardDescription>volume-weighted, whole market</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <UnderwaterRing value={market.underwater} />
            <Button
              variant="outline"
              size="sm"
              onClick={() => analyst.mutate(summary)}
              disabled={analyst.isPending}
            >
              {analyst.isPending ? (
                <>
                  <Spinner data-icon="inline-start" />
                  Reading the tape
                </>
              ) : (
                <>
                  <SparklesIcon data-icon="inline-start" />
                  Analyst read
                </>
              )}
            </Button>
            {analyst.isError ? (
              <p className="text-xs text-destructive">{analyst.error.message}</p>
            ) : null}
            {analyst.data ? (
              <p className="text-sm leading-relaxed text-muted-foreground">{analyst.data}</p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Underwater by sector</CardTitle>
            <CardDescription>share of each sector&apos;s traded volume below cost basis</CardDescription>
          </CardHeader>
          <CardContent>
            <SectorBarChart sectors={dataset.sectors} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Leaderboards</CardTitle>
            <CardDescription>most trapped and cleanest air</CardDescription>
          </CardHeader>
          <CardContent>
            <Leaderboards assets={dataset.assets} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
