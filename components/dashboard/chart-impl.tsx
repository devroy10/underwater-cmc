"use client";

import type { MarketPoint, SectorSummary } from "@/lib/types";
import { AreaChart, Area } from "@/components/charts/area-chart";
import { BarChart } from "@/components/charts/bar-chart";
import { Bar } from "@/components/charts/bar";
import { BarYAxis } from "@/components/charts/bar-y-axis";
import { Grid } from "@/components/charts/grid";
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

  return (
    <AreaChart data={data} xDataKey="date" aspectRatio="2 / 1" className="w-full">
      <Grid horizontal />
      <Area dataKey="underwater" fill="var(--underwater)" />
      <Area dataKey="breadth" fill="var(--profit)" fillOpacity={0.22} strokeWidth={1.5} />
      <XAxis />
      <ChartTooltip />
    </AreaChart>
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
