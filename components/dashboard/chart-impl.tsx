"use client";

import type { MarketPoint, SectorSummary } from "@/lib/types";
import { AreaChart, Area } from "@/components/charts/area-chart";
import { BarChart } from "@/components/charts/bar-chart";
import { Bar } from "@/components/charts/bar";
import { BarYAxis } from "@/components/charts/bar-y-axis";
import { Grid } from "@/components/charts/grid";
import {
  Legend,
  LegendItem,
  LegendLabel,
  LegendMarker,
  LegendValue,
} from "@/components/charts/legend";
import { RingChart } from "@/components/charts/ring-chart";
import { Ring } from "@/components/charts/ring";
import { RingCenter } from "@/components/charts/ring-center";
import { ChartTooltip } from "@/components/charts/tooltip";
import { XAxis } from "@/components/charts/x-axis";

const pctValue = (fraction: number) => Math.round(fraction * 1000) / 10;

export function MarketIndexChart({ series }: { series: MarketPoint[] }) {
  const data = series.map((p) => ({
    date: p.t,
    underwater: pctValue(p.underwater),
    breadth: pctValue(p.breadth),
  }));

  const last = data[data.length - 1];
  const legend = [
    { label: "Underwater supply", value: last?.underwater ?? 0, color: "var(--underwater)" },
    { label: "Market breadth", value: last?.breadth ?? 0, color: "var(--profit)" },
  ];

  return (
    <div className="flex flex-col gap-3">
      <Legend items={legend} className="flex-row flex-wrap gap-x-4 gap-y-1">
        <LegendItem className="flex items-center gap-2 px-1 py-0.5">
          <LegendMarker className="h-2.5 w-2.5" />
          <LegendLabel className="text-xs font-medium" />
          <LegendValue className="text-xs" formatValue={(v) => `${v}%`} />
        </LegendItem>
      </Legend>
      <AreaChart data={data} xDataKey="date" aspectRatio="2 / 1" className="w-full">
        <Grid horizontal />
        <Area dataKey="underwater" fill="var(--underwater)" />
        <Area dataKey="breadth" fill="var(--profit)" fillOpacity={0.22} strokeWidth={1.5} />
        <XAxis />
        <ChartTooltip />
      </AreaChart>
    </div>
  );
}

export function UnderwaterRing({ value }: { value: number }) {
  const data = [
    {
      label: "Underwater",
      value: Math.round(value * 100),
      maxValue: 100,
      color: "var(--underwater)",
    },
  ];
  return (
    <RingChart data={data} size={200} strokeWidth={14} baseInnerRadius={62}>
      <Ring index={0} />
      <RingCenter defaultLabel="Underwater" suffix="%" />
    </RingChart>
  );
}

const SECTOR_SHORT: Record<string, string> = {
  "AI & Big Data": "AI",
  "Real World Assets": "RWA",
  "CeFi & Exchange": "CeFi",
  Infrastructure: "Infra",
  Stablecoin: "Stables",
};

export function SectorBarChart({ sectors }: { sectors: SectorSummary[] }) {
  const data = sectors.map((s) => ({
    name: SECTOR_SHORT[s.sector] ?? s.sector,
    underwater: Math.round(s.underwater * 100),
  }));

  return (
    <BarChart
      data={data}
      xDataKey="name"
      orientation="horizontal"
      aspectRatio="1.15 / 1"
      barGap={0.35}
      className="w-full"
    >
      <Grid vertical />
      <Bar dataKey="underwater" fill="var(--underwater)" lineCap="round" />
      <BarYAxis />
      <ChartTooltip />
    </BarChart>
  );
}
