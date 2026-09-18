export const DEFAULT_LEAGUE = "Allflame";
export const DEFAULT_REALM = "poe1";

export type CurrencyOption = {
  id: number;
  displayName: string;
};

export type MarketPairFilters = {
  league: string;
  currencyAId: number | null;
  currencyBId: number | null;
  minVolume: number | null;
  minBidSpread: number | null; // fraction, e.g. 0.05 = 5%
};

export type MarketPairRow = {
  marketPairId: string;
  league: string;
  snapshotHour: string;
  currencyA: CurrencyOption;
  currencyB: CurrencyOption;
  volumeA: number;
  volumeB: number;
  totalVolume: number;
  lowRate: number;
  highRate: number;
  bidSpread: number;
  lowestRatioA: number;
  lowestRatioB: number;
  highestRatioA: number;
  highestRatioB: number;
};

export type MarketPairsPageData = {
  rows: MarketPairRow[];
  snapshotHour: string | null;
  leagues: string[];
  currencies: CurrencyOption[];
  filters: MarketPairFilters;
};
