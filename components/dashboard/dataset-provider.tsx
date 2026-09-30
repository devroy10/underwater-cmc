"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { SlimDataset } from "@/lib/types";
import { useDataset } from "@/lib/dashboard/queries";

type RefreshResult = ReturnType<typeof useDataset>["refresh"];

interface DatasetContextValue {
  dataset: SlimDataset;
  refresh: RefreshResult;
}

const DatasetContext = createContext<DatasetContextValue | null>(null);

export function useDatasetContext(): DatasetContextValue {
  const value = useContext(DatasetContext);
  if (!value) throw new Error("useDatasetContext must be used inside <DatasetProvider>");
  return value;
}

export function DatasetProvider({
  initial,
  children,
}: {
  initial: SlimDataset;
  children: ReactNode;
}) {
  const { dataset, refresh } = useDataset(initial);
  return (
    <DatasetContext.Provider value={{ dataset, refresh }}>{children}</DatasetContext.Provider>
  );
}
