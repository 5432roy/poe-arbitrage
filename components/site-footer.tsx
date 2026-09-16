import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="page-wrap flex flex-col gap-6 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-xl space-y-3">
          <p className="font-display text-lg tracking-wide text-foreground">
            Exile Routes
          </p>
          <p className="text-sm leading-relaxed text-foreground-muted">
            Currency Exchange data is historical and grouped into hourly
            digests. Current-hour prices are not available through the official
            API, so actual in-game rates may differ.
          </p>
          <p className="text-sm leading-relaxed text-foreground-muted">
            Built to read official Currency Exchange snapshots across Path of
            Exile leagues and realms — not a single-league companion, and not a
            live Faustus feed.
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-col gap-2 text-sm">
          <Link
            href="/opportunities"
            className="text-foreground-muted transition-colors duration-fast hover:text-foreground"
          >
            Opportunities
          </Link>
          <Link
            href="/conversion"
            className="text-foreground-muted transition-colors duration-fast hover:text-foreground"
          >
            Conversion
          </Link>
        </nav>
      </div>
    </footer>
  );
}
