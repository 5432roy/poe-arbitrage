"use client";

export default function MarketError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="section-space">
      <div className="page-wrap max-w-2xl space-y-6">
        <p className="text-sm font-medium tracking-wide text-error">
          Could not load market pairs
        </p>
        <h1 className="font-display text-4xl tracking-wide text-foreground sm:text-5xl">
          Market
        </h1>
        <p className="text-lg leading-relaxed text-foreground-muted">
          The latest completed Currency Exchange snapshot could not be loaded.
          This page is historical snapshot data, not a live Faustus feed.
        </p>
        <div className="rounded-lg border border-border bg-surface p-6 text-base leading-relaxed text-foreground-muted">
          Try again in a moment. If the problem continues, the query for the
          latest completed market pairs may be unavailable.
        </div>
        <div>
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors duration-fast ease-standard hover:bg-primary-hover"
          >
            Try again
          </button>
        </div>
      </div>
    </section>
  );
}
