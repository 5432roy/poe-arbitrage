import Link from "next/link";
import { CtaLink } from "@/components/cta-link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-header border-b border-border bg-background">
      <div className="page-wrap flex min-h-header flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-0">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="font-display text-xl tracking-wide text-foreground"
          >
            Exile Routes
          </Link>
          <div className="sm:hidden">
            <CtaLink href="/conversion">Find conversion path</CtaLink>
          </div>
        </div>
        <nav
          aria-label="Primary"
          className="flex flex-wrap items-center gap-x-5 gap-y-2 sm:gap-6"
        >
          <CtaLink href="/market" variant="nav">
            Market
          </CtaLink>
          <CtaLink href="/opportunities" variant="nav">
            Opportunities
          </CtaLink>
          <CtaLink href="/conversion" variant="nav">
            Conversion
          </CtaLink>
          <div className="hidden sm:block">
            <CtaLink href="/conversion">Find conversion path</CtaLink>
          </div>
        </nav>
      </div>
    </header>
  );
}
