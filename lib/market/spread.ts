export type RatioQuote = {
  lowestRatioA: number;
  lowestRatioB: number;
  highestRatioA: number;
  highestRatioB: number;
};

export type BidSpread = {
  lowRate: number;
  highRate: number;
  bidSpread: number;
};

function isFiniteNumber(value: number) {
  return Number.isFinite(value);
}

function isNonZeroFinite(value: number) {
  return isFiniteNumber(value) && value !== 0;
}

export function computeBidSpread(quote: RatioQuote): BidSpread | null {
  const { lowestRatioA, lowestRatioB, highestRatioA, highestRatioB } = quote;

  if (
    !isFiniteNumber(lowestRatioA) ||
    !isFiniteNumber(highestRatioA) ||
    !isNonZeroFinite(lowestRatioB) ||
    !isNonZeroFinite(highestRatioB)
  ) {
    return null;
  }

  const lowRate = lowestRatioA / lowestRatioB;
  const highRate = highestRatioA / highestRatioB;

  if (!isNonZeroFinite(lowRate) || !isFiniteNumber(highRate)) {
    return null;
  }

  return {
    lowRate,
    highRate,
    bidSpread: (highRate - lowRate) / lowRate,
  };
}
