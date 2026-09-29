import { Dashboard } from "@/components/Dashboard";
import { getSnapshot } from "@/lib/dataset";
import { toSlim } from "@/lib/underwater";

/**
 * The dashboard is a Server Component: it reads the bundled snapshot at build
 * time (zero API calls, always renders) and hydrates the interactive charts
 * with a slim, serialized dataset.
 */
export default function Page() {
  const dataset = getSnapshot();
  return <Dashboard dataset={toSlim(dataset)} />;
}
