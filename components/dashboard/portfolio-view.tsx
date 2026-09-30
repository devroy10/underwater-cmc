"use client";

import { PortfolioPanel } from "@/components/PortfolioPanel";
import { Card, CardContent } from "@/components/ui/card";
import { useDatasetContext } from "./dataset-provider";
import { PageHeader } from "./page-header";

export function PortfolioView() {
  const { dataset } = useDatasetContext();

  return (
    <>
      <PageHeader
        title="Portfolio"
        description="Enter your holdings as SYMBOL value per line. The tool weights each asset's cost-basis position by its share of your book."
      />
      <Card className="max-w-3xl">
        <CardContent>
          <PortfolioPanel assets={dataset.assets} />
        </CardContent>
      </Card>
    </>
  );
}
