import type { MarketPairRow } from "@/lib/market/types";

type MarketPairsTableProps = {
  rows: MarketPairRow[];
};

const headerCellClassName =
  "whitespace-nowrap px-4 py-3 text-left text-xs font-medium tracking-wide text-foreground-muted";

const bodyCellClassName = "whitespace-nowrap px-4 py-3 text-sm";

export function MarketPairsTable({ rows }: MarketPairsTableProps) {
  return (
    <div className="overflow-x-auto rounded-md border border-border bg-surface">
      <table className="min-w-full border-collapse">
        <caption className="sr-only">
          Latest market pair quotes sorted by bid spread
        </caption>
        <thead>
          <tr className="border-b border-border bg-surface-muted">
            <th scope="col" className={headerCellClassName}>
              Pair
            </th>
            <th scope="col" className={headerCellClassName}>
              Low quote
            </th>
            <th scope="col" className={headerCellClassName}>
              High quote
            </th>
            <th scope="col" className={headerCellClassName}>
              Bid spread
            </th>
            <th scope="col" className={headerCellClassName}>
              Volume A
            </th>
            <th scope="col" className={headerCellClassName}>
              Volume B
            </th>
            <th scope="col" className={headerCellClassName}>
              League
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={7}
                className="px-4 py-12 text-center text-sm leading-relaxed text-foreground-muted"
              >
                <p role="status">
                  No market pairs match the current filters. That can happen
                  when volume or spread thresholds are high, or the selected
                  currencies have no pair in this snapshot. Lower the minimums
                  or reset the filters to see more rows.
                </p>
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={row.marketPairId}
                className="border-b border-border last:border-b-0"
              >
                <td className={`${bodyCellClassName} text-foreground`}>
                  {row.currencyA.displayName} → {row.currencyB.displayName}
                </td>
                <td className={`${bodyCellClassName} font-mono tabular-nums`}>
                  {formatQuote(row.lowestRatioA, row.lowestRatioB)}
                </td>
                <td className={`${bodyCellClassName} font-mono tabular-nums`}>
                  {formatQuote(row.highestRatioA, row.highestRatioB)}
                </td>
                <td className={`${bodyCellClassName} font-mono tabular-nums`}>
                  {formatBidSpread(row.bidSpread)}
                </td>
                <td className={`${bodyCellClassName} font-mono tabular-nums`}>
                  {formatVolume(row.volumeA)}
                </td>
                <td className={`${bodyCellClassName} font-mono tabular-nums`}>
                  {formatVolume(row.volumeB)}
                </td>
                <td className={`${bodyCellClassName} text-foreground-muted`}>
                  {row.league}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function formatQuote(ratioA: number, ratioB: number): string {
  return `${formatRatioPart(ratioA)} : ${formatRatioPart(ratioB)}`;
}

function formatRatioPart(value: number): string {
  if (Number.isInteger(value)) {
    return String(value);
  }

  return String(Number(value.toFixed(4)));
}

function formatBidSpread(fraction: number): string {
  return `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
  }).format(fraction * 100)}%`;
}

function formatVolume(value: number): string {
  return value.toLocaleString("en-US");
}
