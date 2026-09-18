import type { ReactNode } from "react";

const LAST_UPDATED_LABEL = "17 September 2026";
const LAST_UPDATED_ISO = "2026-09-17";

type LegalPageProps = {
  title: string;
  children: ReactNode;
};

export function LegalPage({ title, children }: LegalPageProps) {
  return (
    <section className="section-space">
      <div className="page-wrap max-w-2xl space-y-6">
        <header className="space-y-3">
          <h1 className="font-display text-4xl tracking-wide text-foreground sm:text-5xl">
            {title}
          </h1>
          <p className="text-sm text-foreground-muted">
            Last updated:{" "}
            <time dateTime={LAST_UPDATED_ISO}>{LAST_UPDATED_LABEL}</time>
          </p>
        </header>
        <article className="space-y-4 text-base leading-relaxed text-foreground-muted [&_a]:underline [&_a]:underline-offset-2 [&_a]:transition-colors [&_a]:duration-fast [&_a]:hover:text-foreground [&_h2]:pt-4 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:tracking-wide [&_h2]:text-foreground [&_h2:first-child]:pt-0 [&_h3]:pt-2 [&_h3]:font-display [&_h3]:text-xl [&_h3]:tracking-wide [&_h3]:text-foreground [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5 [&_strong]:font-medium [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
          {children}
        </article>
      </div>
    </section>
  );
}
