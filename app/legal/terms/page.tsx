import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Terms of Use",
  description:
    "Terms of Use for Exile Routes, a fan-made Path of Exile market-analysis tool operated by POE Arbitrage.",
};

export default function TermsOfUsePage() {
  return (
    <LegalPage title="Terms of Use">
      <p>
        These Terms of Use (“Terms”) govern your access to and use of Exile
        Routes (the “Service”). Exile Routes is a fan-made market-analysis tool
        operated by POE Arbitrage. By using the Service, you agree to these
        Terms. If you do not agree, do not use the Service.
      </p>
      <p>
        This document is a practical site template for the Service. It is not
        formal legal advice.
      </p>

      <h2>Who we are</h2>
      <p>
        Exile Routes is operated by POE Arbitrage. It is an unofficial companion
        for Path of Exile players. It is not a Grinding Gear Games product, and
        Grinding Gear Games does not operate or endorse it.
      </p>
      <p>
        This product isn&apos;t affiliated with or endorsed by Grinding Gear
        Games in any way.
      </p>

      <h2>Intellectual property</h2>
      <p>
        Path of Exile, Path of Exile 2, and related names, marks, and other
        intellectual property belong to Grinding Gear Games. POE Arbitrage
        claims copyright only in the original copy, design, and code of Exile
        Routes. Nothing in these Terms or on the Service grants you any right in
        Grinding Gear Games intellectual property.
      </p>

      <h2>The Service</h2>
      <p>
        Exile Routes is an informational market-analysis tool. It uses the
        official Path of Exile Currency Exchange API. Data on the Service is
        historical and grouped into completed hourly digests. The official API
        does not expose the current hour, so the Service is not a live Faustus
        feed and in-game rates may differ from what you see here.
      </p>
      <p>
        Information on the Service is provided for analysis only. It does not
        guarantee profit, a still-available trade, or any particular in-game
        outcome. You remain responsible for how you use the information and for
        any trades you make in Path of Exile.
      </p>
      <p>
        You must still follow Grinding Gear Games&apos;{" "}
        <a
          href="https://www.pathofexile.com/legal/terms-of-use-and-privacy-policy"
          rel="noopener noreferrer"
        >
          Terms of Use and Privacy Policy
        </a>. These Terms do not replace or modify GGG&apos;s terms.
      </p>

      <h2>Acceptable use</h2>
      <p>
        You may use the Service only for lawful, personal, informational
        purposes. You must not:
      </p>
      <ul>
        <li>
          Use the Service to support botting, real-money trading (RMT), or
          unofficial Path of Exile client automation.
        </li>
        <li>
          Attempt to automate trades, scrape or reverse-engineer the in-game
          Faustus interface, or otherwise interfere with Path of Exile or the
          Service.
        </li>
        <li>
          Probe, overload, or disrupt the Service, or access it by any means
          other than the interfaces we provide.
        </li>
        <li>
          Misrepresent the Service as official, affiliated with, or endorsed by
          Grinding Gear Games.
        </li>
      </ul>
      <p>
        We may suspend or stop providing access if we believe these Terms have
        been violated.
      </p>

      <h2>Disclaimer of warranties</h2>
      <p>
        The Service is provided “as is” and “as available,” without warranties of
        any kind, whether express, implied, or statutory. We do not warrant that
        the Service will be uninterrupted, error-free, current, or complete, or
        that historical Currency Exchange data will match live in-game rates.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the fullest extent permitted by applicable law, POE Arbitrage and the
        people who operate Exile Routes are not liable for any indirect,
        incidental, special, consequential, or punitive damages, or for any loss
        of profits, data, or in-game currency, arising from your use of the
        Service or reliance on information it displays.
      </p>
      <p>
        If a court finds any part of these Terms unenforceable, the rest remains
        in effect.
      </p>

      <h2>Changes</h2>
      <p>
        We may change the Service or these Terms at any time. The “Last updated”
        date at the top of this page will change when we do. Continued use of the
        Service after an update means you accept the revised Terms.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these Terms:{" "}
        <a href="mailto:shangyu051601@gmail.com">shangyu051601@gmail.com</a>.
      </p>
    </LegalPage>
  );
}
