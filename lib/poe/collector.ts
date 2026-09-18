import "server-only";

import { gzipSync } from "node:zlib";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  MarketIngestionResult,
  PoeCurrencyResponse,
} from "@/lib/poe/types";

const DEFAULT_BUCKET = "poe-data";
const DEFAULT_REALM = "poe1";
const HOUR_SECONDS = 60 * 60;
const MISSING_HOUR_GRACE_SECONDS = 6 * HOUR_SECONDS;
const MAX_REQUESTS_PER_RUN = 24;
const SOFT_DEADLINE_MS = 4 * 60 * 1000;
const LEASE_SECONDS = 6 * 60;
const FETCH_TIMEOUT_MS = 30 * 1000;

type ClaimRow = {
  result_acquired: boolean;
  result_run_id: string;
  result_lease_token: string | null;
  result_next_cursor: number;
};

type IngestRow = {
  result_snapshot_id: string;
  result_market_row_count: number;
  already_ingested: boolean;
};

function firstRow<T>(data: unknown, label: string): T {
  if (!Array.isArray(data) || data.length !== 1) {
    throw new Error(`Invalid ${label} response`);
  }

  return data[0] as T;
}

function isPoeCurrencyResponse(value: unknown): value is PoeCurrencyResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const response = value as Partial<PoeCurrencyResponse>;

  return (
    typeof response.next_change_id === "number" &&
    Number.isFinite(response.next_change_id) &&
    Array.isArray(response.markets)
  );
}

function isOldEnoughToSkip(cursor: number) {
  return (
    Math.floor(Date.now() / 1000) - cursor >=
    MISSING_HOUR_GRACE_SECONDS
  );
}

function rawObjectPath(cursor: number) {
  const date = new Date(cursor * 1000);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `currency-exchange/${year}/${month}/${day}/${cursor}.json.gz`;
}

async function saveRawResponse(
  supabase: SupabaseClient,
  bucket: string,
  cursor: number,
  response: PoeCurrencyResponse,
) {
  const path = rawObjectPath(cursor);
  const storedData = {
    cursor,
    fetched_at: new Date().toISOString(),
    data: response,
  };
  const compressed = gzipSync(
    Buffer.from(JSON.stringify(storedData), "utf8"),
  );

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, compressed, {
      contentType: "application/gzip",
      cacheControl: "3600",
      upsert: true,
    });

  if (error) {
    throw new Error(`Unable to upload ${path}: ${error.message}`);
  }

  return path;
}

async function recordGap(
  supabase: SupabaseClient,
  realm: string,
  cursor: number,
  status: "pending" | "confirmed_missing" | "recovered",
  httpStatus: number | null,
  errorMessage: string | null,
) {
  const { error } = await supabase.rpc("record_market_ingestion_gap", {
    p_realm: realm,
    p_cursor: cursor,
    p_status: status,
    p_http_status: httpStatus,
    p_error_message: errorMessage,
  });

  if (error) {
    throw new Error(`Unable to record cursor ${cursor}: ${error.message}`);
  }
}

async function advanceCursor(
  supabase: SupabaseClient,
  realm: string,
  leaseToken: string,
  expectedCursor: number,
  nextCursor: number,
) {
  const { data, error } = await supabase.rpc(
    "advance_market_ingestion_cursor",
    {
      p_realm: realm,
      p_lease_token: leaseToken,
      p_expected_cursor: expectedCursor,
      p_next_cursor: nextCursor,
      p_lease_seconds: LEASE_SECONDS,
    },
  );

  if (error) {
    throw new Error(`Unable to advance cursor: ${error.message}`);
  }

  if (data !== true) {
    throw new Error("The ingestion lease or cursor changed unexpectedly");
  }
}

async function ingestResponse(
  supabase: SupabaseClient,
  realm: string,
  cursor: number,
  response: PoeCurrencyResponse,
  path: string,
) {
  const { data, error } = await supabase.rpc("ingest_market_snapshot", {
    p_realm: realm,
    p_snapshot_hour: new Date(cursor * 1000).toISOString(),
    p_next_change_id: response.next_change_id,
    p_raw_object_path: path,
    p_markets: response.markets,
  });

  if (error) {
    throw new Error(`Unable to ingest ${path}: ${error.message}`);
  }

  const result = firstRow<IngestRow>(data, "ingestion");

  if (
    typeof result.result_snapshot_id !== "string" ||
    typeof result.result_market_row_count !== "number"
  ) {
    throw new Error(`Invalid ingestion result for ${path}`);
  }

  return result;
}

async function finishRun(
  supabase: SupabaseClient,
  values: {
    runId: string;
    realm: string;
    leaseToken: string;
    status: "completed" | "failed";
    endCursor: number;
    processedCount: number;
    gapCount: number;
    errorMessage: string | null;
  },
) {
  const { data, error } = await supabase.rpc(
    "finish_market_ingestion_run",
    {
      p_run_id: values.runId,
      p_realm: values.realm,
      p_lease_token: values.leaseToken,
      p_status: values.status,
      p_end_cursor: values.endCursor,
      p_processed_count: values.processedCount,
      p_gap_count: values.gapCount,
      p_error_message: values.errorMessage,
    },
  );

  if (error) {
    throw new Error(`Unable to finish ingestion run: ${error.message}`);
  }

  if (data !== true) {
    throw new Error("The ingestion run could not be finalized");
  }
}

export async function collectPoeCurrencyData(): Promise<MarketIngestionResult> {
  const startedAt = Date.now();
  const supabase = createSupabaseAdminClient();
  const realm = process.env.POE_REALM ?? DEFAULT_REALM;
  const bucket = process.env.POE_BUCKET ?? DEFAULT_BUCKET;

  const { data: claimData, error: claimError } = await supabase.rpc(
    "claim_market_ingestion_run",
    {
      p_realm: realm,
      p_lease_seconds: LEASE_SECONDS,
    },
  );

  if (claimError) {
    throw new Error(`Unable to claim ingestion run: ${claimError.message}`);
  }

  const claim = firstRow<ClaimRow>(claimData, "claim");

  if (!claim.result_acquired) {
    return {
      ok: true,
      runId: claim.result_run_id,
      skipped: true,
      caughtUp: false,
      nextCursor: claim.result_next_cursor,
      processedCount: 0,
      gapCount: 0,
      savedPaths: [],
    };
  }

  if (!claim.result_lease_token) {
    throw new Error("Claimed ingestion run did not return a lease token");
  }

  const runId = claim.result_run_id;
  const leaseToken = claim.result_lease_token;
  let cursor = claim.result_next_cursor;
  let processedCount = 0;
  let gapCount = 0;
  const savedPaths: string[] = [];

  try {
    for (let requestIndex = 0; requestIndex < MAX_REQUESTS_PER_RUN; requestIndex++) {
      if (Date.now() - startedAt >= SOFT_DEADLINE_MS) {
        break;
      }

      const response = await fetch(
        `https://web.poecdn.com/api/currency-exchange/${cursor}`,
        {
          headers: {
            Accept: "application/json",
            "User-Agent": "poe-arbitrage/1.0",
          },
          cache: "no-store",
          signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        },
      );

      if (response.status === 404) {
        gapCount += 1;

        if (!isOldEnoughToSkip(cursor)) {
          await recordGap(
            supabase,
            realm,
            cursor,
            "pending",
            response.status,
            "The current PoE digest has not been published yet.",
          );

          await finishRun(supabase, {
            runId,
            realm,
            leaseToken,
            status: "completed",
            endCursor: cursor,
            processedCount,
            gapCount,
            errorMessage: null,
          });

          return {
            ok: true,
            runId,
            skipped: false,
            caughtUp: true,
            waitingForCursor: cursor,
            nextCursor: cursor,
            processedCount,
            gapCount,
            savedPaths,
          };
        }

        await recordGap(
          supabase,
          realm,
          cursor,
          "confirmed_missing",
          response.status,
          "The historical PoE digest remained unavailable after the grace period.",
        );

        const nextCursor = cursor + HOUR_SECONDS;
        await advanceCursor(
          supabase,
          realm,
          leaseToken,
          cursor,
          nextCursor,
        );
        cursor = nextCursor;
        continue;
      }

      if (!response.ok) {
        const body = await response.text();
        throw new Error(
          `PoE API returned ${response.status} ${response.statusText}: ${body.slice(0, 500)}`,
        );
      }

      const unknownData: unknown = await response.json();

      if (!isPoeCurrencyResponse(unknownData)) {
        throw new Error(`Invalid PoE response for cursor ${cursor}`);
      }

      if (unknownData.next_change_id < cursor) {
        throw new Error(
          `PoE returned backwards cursor ${cursor} -> ${unknownData.next_change_id}`,
        );
      }

      const currentCursor = cursor;
      const path = await saveRawResponse(
        supabase,
        bucket,
        currentCursor,
        unknownData,
      );
      const ingestion = await ingestResponse(
        supabase,
        realm,
        currentCursor,
        unknownData,
        path,
      );

      console.info("PoE market snapshot ingested", {
        cursor: currentCursor,
        nextCursor: unknownData.next_change_id,
        snapshotId: ingestion.result_snapshot_id,
        marketRowCount: ingestion.result_market_row_count,
        alreadyIngested: ingestion.already_ingested,
      });

      await recordGap(
        supabase,
        realm,
        currentCursor,
        "recovered",
        response.status,
        null,
      );

      processedCount += 1;
      savedPaths.push(path);

      await advanceCursor(
        supabase,
        realm,
        leaseToken,
        currentCursor,
        unknownData.next_change_id,
      );
      cursor = unknownData.next_change_id;

      if (cursor === currentCursor) {
        await finishRun(supabase, {
          runId,
          realm,
          leaseToken,
          status: "completed",
          endCursor: cursor,
          processedCount,
          gapCount,
          errorMessage: null,
        });

        return {
          ok: true,
          runId,
          skipped: false,
          caughtUp: true,
          nextCursor: cursor,
          processedCount,
          gapCount,
          savedPaths,
        };
      }
    }

    await finishRun(supabase, {
      runId,
      realm,
      leaseToken,
      status: "completed",
      endCursor: cursor,
      processedCount,
      gapCount,
      errorMessage: null,
    });

    return {
      ok: true,
      runId,
      skipped: false,
      caughtUp: false,
      nextCursor: cursor,
      processedCount,
      gapCount,
      savedPaths,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    try {
      await finishRun(supabase, {
        runId,
        realm,
        leaseToken,
        status: "failed",
        endCursor: cursor,
        processedCount,
        gapCount,
        errorMessage: message,
      });
    } catch (finishError) {
      console.error("Unable to record failed ingestion run", finishError);
    }

    throw error;
  }
}
