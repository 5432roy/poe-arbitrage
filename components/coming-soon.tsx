import type { ReactNode } from "react";
import { CtaLink } from "@/components/cta-link";

const historicalNotice =
  "Currency Exchange data is historical and grouped into hourly digests. Current-hour prices are not available through the official API, so actual in-game rates may differ.";

type ComingSoonProps = {
  eyebrow: string;
  title: string;
  description: string;
  details: ReactNode;
};

export function ComingSoon({
  eyebrow,
  title,
  description,
  details,
}: ComingSoonProps) {
  return (
    <section className="section-space">
      <div className="page-wrap max-w-2xl space-y-6">
        <p className="text-sm font-medium tracking-wide text-primary">
          {eyebrow}
        </p>
        <h1 className="font-display text-4xl tracking-wide text-foreground sm:text-5xl">
          {title}
        </h1>
        <p className="text-lg leading-relaxed text-foreground-muted">
          {description}
        </p>
        <div className="rounded-lg border border-border bg-surface p-6 text-base leading-relaxed text-foreground-muted">
          {details}
        </div>
        <p role="note" className="text-sm leading-relaxed text-foreground-muted">
          {historicalNotice}
        </p>
        <div>
          <CtaLink href="/" variant="secondary">
            Back to Exile Routes
          </CtaLink>
        </div>
      </div>
    </section>
  );
}
