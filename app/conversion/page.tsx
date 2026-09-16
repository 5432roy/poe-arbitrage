import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = {
  title: "Conversion",
  description:
    "Find a cheaper multi-step conversion path from the latest completed Path of Exile Currency Exchange snapshot. Coming soon.",
};

export default function ConversionPage() {
  return (
    <ComingSoon
      eyebrow="Coming soon"
      title="Conversion"
      description="A have / want / amount tool for comparing a direct pair against a multi-step path on the latest completed snapshot."
      details={
        <p>
          You will enter the currency you hold, the currency you want, and how
          much you mean to move. Exile Routes will then report whether an
          indirect conversion path offered better estimated purchasing power than
          exchanging directly — historical snapshot only, not a live quote.
        </p>
      }
    />
  );
}
