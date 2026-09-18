import { DEFAULT_LEAGUE, type MarketPairFilters } from "@/lib/market/types";

export type MarketPairSearchParams =
  | URLSearchParams
  | Record<string, string | string[] | undefined>;

function normalize(value: string | null | undefined) {
  if (value == null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function hasGet(
  searchParams: MarketPairSearchParams,
): searchParams is URLSearchParams {
  return typeof (searchParams as URLSearchParams).get === "function";
}

function readParam(searchParams: MarketPairSearchParams, key: string) {
  if (hasGet(searchParams)) {
    return normalize(searchParams.get(key));
  }

  const raw = searchParams[key];

  if (Array.isArray(raw)) {
    return normalize(raw[0]);
  }

  return normalize(raw);
}

function parsePositiveInteger(value: string | null) {
  if (value == null || !/^\d+$/.test(value)) {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

function parseNonNegativeNumber(value: string | null) {
  if (value == null) {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

export function parseMarketPairFilters(
  searchParams: MarketPairSearchParams,
): MarketPairFilters {
  const league = readParam(searchParams, "league") ?? DEFAULT_LEAGUE;
  const minSpreadPercent = parseNonNegativeNumber(
    readParam(searchParams, "minSpread"),
  );

  return {
    league,
    currencyAId: parsePositiveInteger(readParam(searchParams, "currencyA")),
    currencyBId: parsePositiveInteger(readParam(searchParams, "currencyB")),
    minVolume: parseNonNegativeNumber(readParam(searchParams, "minVolume")),
    minBidSpread:
      minSpreadPercent == null ? null : minSpreadPercent / 100,
  };
}
