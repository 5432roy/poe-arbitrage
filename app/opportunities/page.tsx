import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = {
  title: "Opportunities",
  description:
    "Ranked potential opportunities from the latest completed Path of Exile Currency Exchange snapshot. Coming soon.",
};

export default function OpportunitiesPage() {
  return (
    <ComingSoon
      eyebrow="Coming soon"
      title="Opportunities"
      description="A dashboard of ranked potential opportunities from the latest completed Currency Exchange hour — not a live Faustus feed."
      details={
        <p>
          This page will be a table: estimated profit, liquidity, stability, and
          confidence for each route on the latest completed snapshot. Until the
          analysis engine is connected, there are no ranked rows and no sample
          numbers here.
        </p>
      }
    />
  );
}
