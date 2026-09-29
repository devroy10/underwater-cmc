import { Suspense } from "react";
import { Dashboard } from "@/components/Dashboard";
import { getSnapshot } from "@/lib/dataset";
import { toSlim } from "@/lib/underwater";

/**
 * The dashboard is a Server Component: it reads the bundled snapshot at build
 * time (zero API calls, always renders) and hydrates the interactive charts
 * with a slim, serialized dataset. `useSearchParams` (deep links) requires a
 * Suspense boundary.
 */
export default function Page() {
  const dataset = getSnapshot();
  return (
    <Suspense fallback={null}>
      <Dashboard dataset={toSlim(dataset)} />
    </Suspense>
  );
}
