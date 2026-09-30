import { Suspense, type ReactNode } from "react";
import { getSnapshot } from "@/lib/dataset";
import { toSlim } from "@/lib/underwater";
import { DatasetProvider } from "@/components/dashboard/dataset-provider";
import { DashboardShell } from "@/components/dashboard/shell";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const dataset = getSnapshot();
  return (
    <DatasetProvider initial={toSlim(dataset)}>
      <DashboardShell>
        <Suspense fallback={null}>{children}</Suspense>
      </DashboardShell>
    </DatasetProvider>
  );
}
