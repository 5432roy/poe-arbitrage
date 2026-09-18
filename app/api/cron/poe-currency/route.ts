import { timingSafeEqual } from "node:crypto";

import { collectPoeCurrencyData } from "@/lib/poe/collector";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    console.error("CRON_SECRET is not configured");
    return false;
  }

  const provided = Buffer.from(
    request.headers.get("authorization") ?? "",
    "utf8",
  );
  const expected = Buffer.from(`Bearer ${secret}`, "utf8");

  return (
    provided.length === expected.length &&
    timingSafeEqual(provided, expected)
  );
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json(
      {
        ok: false,
        error: "Unauthorized",
      },
      {
        status: 401,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  try {
    const result = await collectPoeCurrencyData();

    return Response.json(result, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("PoE currency ingestion failed", error);

    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
