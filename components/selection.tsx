"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * Shared selection state. Lifted into a provider (composition pattern) so the
 * scatter map, the explorer table and the detail drawer stay in sync without
 * prop-drilling or boolean flags.
 */
export interface SelectionApi {
  selectedId: number | null;
  select: (id: number | null) => void;
}

const SelectionContext = createContext<SelectionApi | null>(null);

export function useSelection(): SelectionApi {
  const value = useContext(SelectionContext);
  if (!value) throw new Error("useSelection must be used inside <SelectionProvider>");
  return value;
}

export function SelectionProvider({
  value,
  children,
}: {
  value: SelectionApi;
  children: ReactNode;
}) {
  return <SelectionContext.Provider value={value}>{children}</SelectionContext.Provider>;
}
