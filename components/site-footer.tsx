import Link from "next/link";

const footerLinkClassName =
  "text-foreground-muted transition-colors duration-fast hover:text-foreground";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="page-wrap flex flex-col gap-8 py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
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
            <Link href="/market" className={footerLinkClassName}>
              Market
            </Link>
            <Link href="/opportunities" className={footerLinkClassName}>
              Opportunities
            </Link>
            <Link href="/conversion" className={footerLinkClassName}>
              Conversion
            </Link>
          </nav>
        </div>
        <div className="space-y-3 border-t border-border pt-6">
          <p className="text-sm leading-relaxed text-foreground-muted">
            This product isn&apos;t affiliated with or endorsed by Grinding Gear
            Games in any way.
          </p>
          <p className="text-sm leading-relaxed text-foreground-muted">
            © 2026 POE Arbitrage. All rights reserved.
          </p>
          <p className="text-sm leading-relaxed text-foreground-muted">
            Path of Exile, Path of Exile 2, and related names and marks belong to
            Grinding Gear Games.
          </p>
          <nav
            aria-label="Legal"
            className="flex flex-wrap gap-x-5 gap-y-2 text-sm"
          >
            <Link href="/legal/terms" className={footerLinkClassName}>
              Terms of Use
            </Link>
            <Link href="/legal/privacy" className={footerLinkClassName}>
              Privacy Policy
            </Link>
            <Link href="/legal/cookies" className={footerLinkClassName}>
              Cookie Policy
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
