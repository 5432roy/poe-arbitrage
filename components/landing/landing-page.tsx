"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CtaLink } from "@/components/cta-link";
import { RouteGraph } from "@/components/landing/route-graph";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const historicalNotice =
  "Currency Exchange data is historical and grouped into hourly digests. Current-hour prices are not available through the official API, so actual in-game rates may differ.";

export function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(
        "(prefers-reduced-motion: reduce)",
        () => {
          gsap.set(
            "[data-hero-headline], [data-hero-body], [data-hero-ctas], [data-route-node], [data-reveal]",
            { autoAlpha: 1, y: 0 },
          );
          gsap.set("[data-route-edge]", { strokeDashoffset: 0 });
        },
        containerRef,
      );

      mm.add(
        "(prefers-reduced-motion: no-preference)",
        () => {
          const edges = gsap.utils.toArray<SVGPathElement>("[data-route-edge]");
          edges.forEach((edge) => {
            const length = edge.getTotalLength();
            gsap.set(edge, {
              strokeDasharray: length,
              strokeDashoffset: length,
            });
          });

          const hero = gsap.timeline({
            defaults: { ease: "power2.out", duration: 0.55 },
          });

          hero
            .from("[data-hero-headline]", { autoAlpha: 0, y: 20, duration: 0.7 })
            .from("[data-hero-body]", { autoAlpha: 0, y: 16 }, "-=0.4")
            .from("[data-hero-ctas]", { autoAlpha: 0, y: 16 }, "-=0.32")
            .from(
              "[data-route-node]",
              { autoAlpha: 0, stagger: 0.12, duration: 0.45 },
              "-=0.2",
            )
            .to(edges, {
              strokeDashoffset: 0,
              duration: 0.65,
              stagger: 0.18,
              ease: "power2.inOut",
            });

          gsap.utils.toArray<HTMLElement>("[data-section]").forEach((section) => {
            const heading = section.querySelector("[data-reveal='heading']");
            const cards = section.querySelectorAll("[data-reveal='card']");

            if (heading) {
              gsap.from(heading, {
                autoAlpha: 0,
                y: 20,
                duration: 0.6,
                ease: "power2.out",
                scrollTrigger: {
                  trigger: heading,
                  start: "top 85%",
                  once: true,
                },
              });
            }

            if (cards.length > 0) {
              gsap.from(cards, {
                autoAlpha: 0,
                y: 20,
                duration: 0.55,
                stagger: 0.12,
                ease: "power2.out",
                scrollTrigger: {
                  trigger: cards[0],
                  start: "top 88%",
                  once: true,
                },
              });
            }
          });
        },
        containerRef,
      );

      return () => mm.revert();
    },
    { scope: containerRef },
  );

  return (
    <div ref={containerRef} className="flex flex-1 flex-col">
      <HeroSection />
      <ProblemSection />
      <ProductsSection />
      <HowItWorksSection />
      <TrustSection />
      <FinalCtaSection />
    </div>
  );
}

function HeroSection() {
  return (
    <section className="section-space relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,color-mix(in_srgb,var(--primary)_12%,transparent),transparent_55%)]"
      />
      <div className="page-wrap relative grid items-center gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-16">
        <div className="max-w-xl space-y-6">
          <p className="text-sm font-medium tracking-wide text-primary">
            Latest completed snapshot · not a live feed
          </p>
          <h1
            data-hero-headline
            className="font-display text-4xl leading-tight tracking-wide text-foreground sm:text-5xl lg:text-6xl"
          >
            Find the conversion the last hour already favored.
          </h1>
          <p
            data-hero-body
            className="text-lg leading-relaxed text-foreground-muted"
          >
            A market-analysis and conversion-routing tool built from the latest
            completed Path of Exile Currency Exchange data.
          </p>
          <div data-hero-ctas className="flex flex-col gap-3 sm:flex-row">
            <CtaLink href="/conversion">Find conversion path</CtaLink>
            <CtaLink href="/opportunities" variant="secondary">
              View opportunities
            </CtaLink>
          </div>
          <p role="note" className="text-sm leading-relaxed text-foreground-muted">
            {historicalNotice}
          </p>
        </div>
        <div className="flex min-w-0 justify-center lg:justify-end">
          <RouteGraph />
        </div>
      </div>
    </section>
  );
}

function ProblemSection() {
  return (
    <section data-section className="section-space border-t border-border bg-surface">
      <div className="page-wrap space-y-10">
        <div data-reveal="heading" className="max-w-2xl space-y-4">
          <h2 className="font-display text-3xl tracking-wide text-foreground sm:text-4xl">
            Direct is not always cheaper.
          </h2>
          <p className="text-base leading-relaxed text-foreground-muted">
            A one-hop pair can hide a better multi-step path on the same
            completed snapshot. The numbers below are an illustrative example —
            estimated conversion advantage from a historical hour, not a live
            quote.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <article
            data-reveal="card"
            className="rounded-lg border border-border bg-background p-6"
          >
            <p className="text-sm font-medium text-foreground-muted">
              Direct route
            </p>
            <p className="mt-3 font-display text-2xl text-foreground">
              Chaos → Sacred
            </p>
            <p className="mt-6 text-sm text-foreground-muted">
              Estimated output
            </p>
            <p className="font-mono text-3xl tabular-nums text-foreground">
              2.00
            </p>
          </article>
          <article
            data-reveal="card"
            className="rounded-lg border border-primary/40 bg-background p-6"
          >
            <p className="text-sm font-medium text-primary">Recommended route</p>
            <p className="mt-3 font-display text-2xl text-foreground">
              Chaos → Divine → Sacred
            </p>
            <p className="mt-6 text-sm text-foreground-muted">
              Estimated output
            </p>
            <p className="font-mono text-3xl tabular-nums text-foreground">
              2.18
            </p>
            <p className="mt-3 text-sm text-success">
              Estimated conversion advantage: +9.0%
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}

function ProductsSection() {
  return (
    <section data-section className="section-space border-t border-border">
      <div className="page-wrap space-y-10">
        <div data-reveal="heading" className="max-w-2xl space-y-4">
          <h2 className="font-display text-3xl tracking-wide text-foreground sm:text-4xl">
            Two questions the snapshot can answer.
          </h2>
          <p className="text-base leading-relaxed text-foreground-muted">
            Exile Routes is built around those questions — ranked potential
            opportunities, and a cheaper path between two currencies you already
            intend to move.
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <article
            data-reveal="card"
            className="flex flex-col rounded-lg border border-border bg-surface p-6"
          >
            <h3 className="font-display text-2xl tracking-wide text-foreground">
              Arbitrage Finder
            </h3>
            <p className="mt-4 flex-1 text-base leading-relaxed text-foreground-muted">
              Which sequence of currency exchanges would have produced the
              highest return based on the latest completed Currency Exchange
              market data?
            </p>
            <div className="mt-6">
              <CtaLink href="/opportunities" variant="secondary">
                View opportunities
              </CtaLink>
            </div>
          </article>
          <article
            data-reveal="card"
            className="flex flex-col rounded-lg border border-border bg-surface p-6"
          >
            <h3 className="font-display text-2xl tracking-wide text-foreground">
              Best Conversion Path
            </h3>
            <p className="mt-4 flex-1 text-base leading-relaxed text-foreground-muted">
              Given currency A and a desired currency B, is there an indirect
              conversion path that provides better purchasing power than
              exchanging A directly for B?
            </p>
            <div className="mt-6">
              <CtaLink href="/conversion">Find conversion path</CtaLink>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section data-section className="section-space border-t border-border bg-surface">
      <div className="page-wrap space-y-10">
        <div data-reveal="heading" className="max-w-2xl space-y-4">
          <h2 className="font-display text-3xl tracking-wide text-foreground sm:text-4xl">
            From an hourly digest to a ranked route.
          </h2>
          <p className="text-base leading-relaxed text-foreground-muted">
            The official API never exposes the current hour. We work with what
            it does expose: completed market history, turned into a directed
            graph, then ranked.
          </p>
        </div>
        <ol className="grid gap-6 md:grid-cols-3">
          <li
            data-reveal="card"
            className="rounded-lg border border-border bg-background p-6"
          >
            <p className="font-mono text-sm text-primary">01</p>
            <h3 className="mt-3 font-display text-xl text-foreground">
              Hourly GGG digest
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-foreground-muted">
              Official Currency Exchange activity, grouped into completed hours.
              That hour is the snapshot — not a ticker, not Faustus as you see
              it now.
            </p>
          </li>
          <li
            data-reveal="card"
            className="rounded-lg border border-border bg-background p-6"
          >
            <p className="font-mono text-sm text-primary">02</p>
            <h3 className="mt-3 font-display text-xl text-foreground">
              Directed market graph
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-foreground-muted">
              Each listed pair becomes a weighted edge. Cycles and conversion
              paths are searched on that graph, not guessed from a single ratio.
            </p>
          </li>
          <li
            data-reveal="card"
            className="rounded-lg border border-border bg-background p-6"
          >
            <p className="font-mono text-sm text-primary">03</p>
            <h3 className="mt-3 font-display text-xl text-foreground">
              Ranked routes
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-foreground-muted">
              Potential opportunities are ordered by estimated profit, then
              judged against liquidity, stability, and how old the snapshot is.
            </p>
          </li>
        </ol>
      </div>
    </section>
  );
}

function TrustSection() {
  return (
    <section data-section className="section-space border-t border-border">
      <div className="page-wrap space-y-10">
        <div data-reveal="heading" className="max-w-2xl space-y-4">
          <h2 className="font-display text-3xl tracking-wide text-foreground sm:text-4xl">
            What a number on this site actually means.
          </h2>
          <p className="text-base leading-relaxed text-foreground-muted">
            Estimated profit and potential opportunity are historical reads.
            Confidence is a separate score from return — a fat cycle on a thin
            pair is still a thin pair.
          </p>
        </div>
        <ul className="grid gap-6 sm:grid-cols-2">
          <li
            data-reveal="card"
            className="rounded-lg border border-border bg-surface p-6"
          >
            <h3 className="text-lg font-medium text-foreground">Data age</h3>
            <p className="mt-3 text-sm leading-relaxed text-foreground-muted">
              If it is 11:42, the newest complete digest may still be 10:00–10:59.
              We surface snapshot time and age so a stale hour is not dressed as
              current profit.
            </p>
          </li>
          <li
            data-reveal="card"
            className="rounded-lg border border-border bg-surface p-6"
          >
            <h3 className="text-lg font-medium text-foreground">Liquidity</h3>
            <p className="mt-3 text-sm leading-relaxed text-foreground-muted">
              A route is only as usable as its weakest edge. Volume on the
              thinnest hop — not the busiest one — sets the liquidity read.
            </p>
          </li>
          <li
            data-reveal="card"
            className="rounded-lg border border-border bg-surface p-6"
          >
            <h3 className="text-lg font-medium text-foreground">Stability</h3>
            <p className="mt-3 text-sm leading-relaxed text-foreground-muted">
              Rates that jumped around recent hours score lower than pairs that
              held still. One print is not a trend.
            </p>
          </li>
          <li
            data-reveal="card"
            className="rounded-lg border border-border bg-surface p-6"
          >
            <h3 className="text-lg font-medium text-foreground">Confidence</h3>
            <p className="mt-3 text-sm leading-relaxed text-foreground-muted">
              Liquidity, stability, and freshness — not estimated profit. Return
              and confidence answer different questions on purpose.
            </p>
          </li>
        </ul>
        <p
          role="note"
          className="max-w-2xl border-l-2 border-warning pl-4 text-sm leading-relaxed text-foreground-muted"
        >
          {historicalNotice}
        </p>
      </div>
    </section>
  );
}

function FinalCtaSection() {
  return (
    <section data-section className="section-space border-t border-border bg-surface">
      <div className="page-wrap max-w-2xl space-y-6">
        <div data-reveal="heading" className="space-y-6">
          <h2 className="font-display text-3xl tracking-wide text-foreground sm:text-4xl">
            Start from the snapshot, not from a guess.
          </h2>
          <p className="text-base leading-relaxed text-foreground-muted">
            Look up a conversion path you already meant to take, or scan ranked
            potential opportunities from the latest completed hour.
          </p>
          <p role="note" className="text-sm leading-relaxed text-foreground-muted">
            {historicalNotice}
          </p>
        </div>
        <div data-reveal="card" className="flex flex-col gap-3 sm:flex-row">
          <CtaLink href="/conversion">Find conversion path</CtaLink>
          <CtaLink href="/opportunities" variant="secondary">
            View opportunities
          </CtaLink>
        </div>
      </div>
    </section>
  );
}
