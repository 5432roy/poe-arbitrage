export type PoeCurrencyResponse = {
  next_change_id: number;
  markets: unknown[];
};

export type MarketIngestionResult = {
  ok: true;
  runId: string;
  skipped: boolean;
  caughtUp: boolean;
  waitingForCursor?: number;
  nextCursor: number;
  processedCount: number;
  gapCount: number;
  savedPaths: string[];
};
