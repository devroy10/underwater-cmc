/**
 * Build the committed dataset snapshot.
 *
 *   npm run build:dataset            # default universe + window
 *   UNIVERSE=250 WINDOW_DAYS=365 npm run build:dataset
 *
 * Reads `CMC_API_KEY` from the environment or `.env.local`. Writes
 * `data/underwater-snapshot.json` and prints the credit cost + headline number.
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildLiveDataset } from "../lib/dataset";
import { formatCreditReport } from "../lib/report";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");

function loadEnvLocal(): void {
  if (process.env.CMC_API_KEY) return;
  try {
    const raw = readFileSync(resolve(root, ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
      if (!match) continue;
      const [, key, value] = match;
      if (key && process.env[key] === undefined) {
        process.env[key] = value?.replace(/^["']|["']$/g, "") ?? "";
      }
    }
  } catch {
    // .env.local is optional.
  }
}

async function main(): Promise<void> {
  loadEnvLocal();
  if (!process.env.CMC_API_KEY) {
    console.error("CMC_API_KEY is not set (env or .env.local). Aborting.");
    process.exitCode = 1;
    return;
  }

  const universe = Number(process.env.UNIVERSE ?? "200");
  const windowDays = Number(process.env.WINDOW_DAYS ?? "365");
  console.log(`Fetching live data: universe=${universe}, window=${windowDays}d ...`);

  const started = Date.now();
  const { dataset, credits, errors } = await buildLiveDataset({ universe, windowDays });
  const outPath = resolve(root, "data/underwater-snapshot.json");
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(dataset), "utf8");

  console.log(`\n${formatCreditReport(dataset, credits, Date.now() - started)}`);
  if (errors.length > 0) {
    console.log(`\nErrors (${errors.length}):`);
    for (const error of errors) console.log(`  - ${error}`);
  }
  console.log(`\nWrote ${outPath} (${(JSON.stringify(dataset).length / 1024).toFixed(0)} KB)`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
