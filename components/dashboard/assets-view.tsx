"use client";

import { Explorer } from "@/components/Explorer";
import { Card, CardContent } from "@/components/ui/card";
import { useDatasetContext } from "./dataset-provider";
import { PageHeader } from "./page-header";

export function AssetsView() {
  const { dataset } = useDatasetContext();

  return (
    <>
      <PageHeader
        title="Assets"
        description="Search, filter, and sort the universe by underwater supply. Filters are stored in the URL, so every view is shareable."
      />
      <Card>
        <CardContent>
          <Explorer assets={dataset.assets} />
        </CardContent>
      </Card>
    </>
  );
}
