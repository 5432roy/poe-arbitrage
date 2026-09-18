import type { Metadata } from "next";
import { MarketFilters } from "@/components/market/market-filters";
import { MarketPairsTable } from "@/components/market/market-pairs-table";
import { parseMarketPairFilters } from "@/lib/market/parse-filters";
import { listLatestMarketPairs } from "@/lib/market/queries";

const historicalNotice =
  "Currency Exchange data is historical and grouped into hourly digests. Current-hour prices are not available through the official API, so actual in-game rates may differ.";

export const metadata: Metadata = {
  title: "Market",
  description:
    "Bid spreads from the latest completed Path of Exile Currency Exchange snapshot — historical data, not a live Faustus feed.",
};

function formatSnapshotHour(snapshotHour: string | null): string {
  if (!snapshotHour) {
    return "No completed snapshot yet";
  }

  const date = new Date(snapshotHour);
  if (Number.isNaN(date.getTime())) {
    return snapshotHour;
  }

  const formatted = new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    hourCycle: "h23",
    timeZone: "UTC",
  }).format(date);

  return `${formatted} UTC`;
}

export default async function MarketPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters = parseMarketPairFilters(params);
  const data = await listLatestMarketPairs(filters);

  return (
    <section className="section-space">
      <div className="page-wrap space-y-8">
        <header className="max-w-3xl space-y-4">
          <p className="text-sm font-medium tracking-wide text-primary">
            Latest completed snapshot · not a live Faustus feed
          </p>
          <div className="space-y-2">
            <h1 className="font-display text-4xl tracking-wide text-foreground sm:text-5xl">
              Market
            </h1>
            <p className="font-mono text-sm text-foreground-muted">
              {formatSnapshotHour(data.snapshotHour)}
            </p>
          </div>
          <p className="text-lg leading-relaxed text-foreground-muted">
            Bid spreads on the latest completed Currency Exchange hour. These
            quotes are a historical digest, not live Faustus prices.
          </p>
          <p role="note" className="text-sm leading-relaxed text-foreground-muted">
            {historicalNotice}
          </p>
        </header>

        <MarketFilters
          leagues={data.leagues}
          currencies={data.currencies}
          values={data.filters}
        />
        <MarketPairsTable rows={data.rows} />
      </div>
    </section>
  );
}
