"use client";

import { Methodology } from "@/components/panels";
import { Card, CardContent } from "@/components/ui/card";
import { useDatasetContext } from "./dataset-provider";
import { PageHeader } from "./page-header";

export function MethodologyView() {
  const { dataset } = useDatasetContext();

  return (
    <>
      <PageHeader
        title="Methodology"
        description="How the cost basis and the underwater supply are derived, which endpoints feed them, and where the CoinMarketCap API got in the way."
      />
      <Card>
        <CardContent>
          <Methodology series={dataset.marketSeries} generatedAt={dataset.generatedAt} />
        </CardContent>
      </Card>
    </>
  );
}
