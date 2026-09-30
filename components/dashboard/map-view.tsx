"use client";

import { useAssetSelection } from "@/lib/dashboard/state";
import { CostBasisMap } from "@/components/charts";
import { Card, CardContent } from "@/components/ui/card";
import { useDatasetContext } from "./dataset-provider";
import { PageHeader } from "./page-header";

export function MapView() {
  const { dataset } = useDatasetContext();
  const { selectedId, select } = useAssetSelection();

  return (
    <>
      <PageHeader
        title="Cost-basis map"
        description="Every asset placed by price against cost basis (right) and by the share of its volume that is underwater (up). The bottom right corner is clean air. The top left is a wall of holders waiting to break even."
      />
      <Card>
        <CardContent>
          <CostBasisMap assets={dataset.assets} selectedId={selectedId} onSelect={select} />
        </CardContent>
      </Card>
    </>
  );
}
