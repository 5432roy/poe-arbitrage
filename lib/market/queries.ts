import "server-only";

import { computeBidSpread } from "@/lib/market/spread";
import {
  DEFAULT_REALM,
  type CurrencyOption,
  type MarketPairFilters,
  type MarketPairRow,
  type MarketPairsPageData,
} from "@/lib/market/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const PAGE_SIZE = 1000;

const PAIR_COLUMNS =
  "market_pair_id, league, snapshot_hour, currency_a_id, currency_b_id, volume_a, volume_b, lowest_ratio_a, lowest_ratio_b, highest_ratio_a, highest_ratio_b";

type QueryPage<T> = {
  data: T[] | null;
  error: { message: string } | null;
};

type LatestMarketPairRecord = {
  market_pair_id: string;
  league: string;
  snapshot_hour: string;
  currency_a_id: number | string;
  currency_b_id: number | string;
  volume_a: number | string | null;
  volume_b: number | string | null;
  lowest_ratio_a: number | string | null;
  lowest_ratio_b: number | string | null;
  highest_ratio_a: number | string | null;
  highest_ratio_b: number | string | null;
};

type LeagueRecord = {
  league: string;
};

type CurrencyRecord = {
  id: number | string;
  display_name: string;
};

async function fetchAllPages<T>(
  loadPage: (from: number, to: number) => PromiseLike<QueryPage<T>>,
  label: string,
) {
  const rows: T[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await loadPage(from, from + PAGE_SIZE - 1);

    if (error) {
      throw new Error(`Failed to load ${label}: ${error.message}`);
    }

    const page = data ?? [];
    rows.push(...page);

    if (page.length < PAGE_SIZE) {
      break;
    }

    from += PAGE_SIZE;
  }

  return rows;
}

function toFiniteNumber(value: number | string | null | undefined) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function toPositiveInteger(value: number | string | null | undefined) {
  const parsed = toFiniteNumber(value);

  if (parsed == null || !Number.isSafeInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

function uniqueSortedLeagues(leagues: string[], selectedLeague: string) {
  const unique = new Set(leagues);

  unique.add(selectedLeague);

  return [...unique].sort((left, right) => left.localeCompare(right));
}

function matchesCurrencyFilter(
  currencyAId: number,
  currencyBId: number,
  filters: MarketPairFilters,
) {
  const { currencyAId: filterA, currencyBId: filterB } = filters;

  if (filterA == null && filterB == null) {
    return true;
  }

  if (filterA != null && filterB != null) {
    return (
      (currencyAId === filterA && currencyBId === filterB) ||
      (currencyAId === filterB && currencyBId === filterA)
    );
  }

  const only = filterA ?? filterB;

  return currencyAId === only || currencyBId === only;
}

function mapPairRow(
  record: LatestMarketPairRecord,
  currenciesById: Map<number, CurrencyOption>,
): MarketPairRow | null {
  const currencyAId = toPositiveInteger(record.currency_a_id);
  const currencyBId = toPositiveInteger(record.currency_b_id);
  const volumeA = toFiniteNumber(record.volume_a);
  const volumeB = toFiniteNumber(record.volume_b);
  const lowestRatioA = toFiniteNumber(record.lowest_ratio_a);
  const lowestRatioB = toFiniteNumber(record.lowest_ratio_b);
  const highestRatioA = toFiniteNumber(record.highest_ratio_a);
  const highestRatioB = toFiniteNumber(record.highest_ratio_b);

  if (
    currencyAId == null ||
    currencyBId == null ||
    volumeA == null ||
    volumeB == null ||
    lowestRatioA == null ||
    lowestRatioB == null ||
    highestRatioA == null ||
    highestRatioB == null
  ) {
    return null;
  }

  const currencyA = currenciesById.get(currencyAId);
  const currencyB = currenciesById.get(currencyBId);
  const spread = computeBidSpread({
    lowestRatioA,
    lowestRatioB,
    highestRatioA,
    highestRatioB,
  });

  if (!currencyA || !currencyB || !spread) {
    return null;
  }

  return {
    marketPairId: record.market_pair_id,
    league: record.league,
    snapshotHour: record.snapshot_hour,
    currencyA,
    currencyB,
    volumeA,
    volumeB,
    totalVolume: volumeA + volumeB,
    lowRate: spread.lowRate,
    highRate: spread.highRate,
    bidSpread: spread.bidSpread,
    lowestRatioA,
    lowestRatioB,
    highestRatioA,
    highestRatioB,
  };
}

export async function listLatestMarketPairs(
  filters: MarketPairFilters,
): Promise<MarketPairsPageData> {
  const supabase = createSupabaseServerClient();

  const [pairRecords, leagueRecords, currencyRecords] = await Promise.all([
    fetchAllPages<LatestMarketPairRecord>(
      (from, to) =>
        supabase
          .from("latest_market_pairs")
          .select(PAIR_COLUMNS)
          .eq("realm", DEFAULT_REALM)
          .eq("league", filters.league)
          .order("market_pair_id")
          .range(from, to),
      "latest market pairs",
    ),
    fetchAllPages<LeagueRecord>(
      (from, to) =>
        supabase
          .from("latest_market_pairs")
          .select("league")
          .eq("realm", DEFAULT_REALM)
          .order("league")
          .order("market_pair_id")
          .range(from, to),
      "market leagues",
    ),
    fetchAllPages<CurrencyRecord>(
      (from, to) =>
        supabase
          .from("currencies")
          .select("id, display_name")
          .order("id")
          .range(from, to),
      "currencies",
    ),
  ]);

  const currenciesById = new Map<number, CurrencyOption>();

  for (const record of currencyRecords) {
    const id = toPositiveInteger(record.id);

    if (id == null || !record.display_name) {
      continue;
    }

    currenciesById.set(id, {
      id,
      displayName: record.display_name,
    });
  }

  const leagueCurrencyIds = new Set<number>();
  const mappedRows: MarketPairRow[] = [];

  for (const record of pairRecords) {
    const currencyAId = toPositiveInteger(record.currency_a_id);
    const currencyBId = toPositiveInteger(record.currency_b_id);

    if (currencyAId != null) {
      leagueCurrencyIds.add(currencyAId);
    }

    if (currencyBId != null) {
      leagueCurrencyIds.add(currencyBId);
    }

    const row = mapPairRow(record, currenciesById);

    if (!row) {
      continue;
    }

    if (!matchesCurrencyFilter(row.currencyA.id, row.currencyB.id, filters)) {
      continue;
    }

    if (filters.minVolume != null && row.totalVolume < filters.minVolume) {
      continue;
    }

    if (filters.minBidSpread != null && row.bidSpread < filters.minBidSpread) {
      continue;
    }

    mappedRows.push(row);
  }

  mappedRows.sort((left, right) => right.bidSpread - left.bidSpread);

  const currencies = [...leagueCurrencyIds]
    .map((id) => currenciesById.get(id))
    .filter((currency): currency is CurrencyOption => currency != null)
    .sort((left, right) => left.displayName.localeCompare(right.displayName));

  return {
    rows: mappedRows,
    snapshotHour: pairRecords[0]?.snapshot_hour ?? null,
    leagues: uniqueSortedLeagues(
      leagueRecords.flatMap((record) =>
        typeof record.league === "string" && record.league.trim() !== ""
          ? [record.league]
          : [],
      ),
      filters.league,
    ),
    currencies,
    filters,
  };
}
