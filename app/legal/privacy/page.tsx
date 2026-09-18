import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Exile Routes handles contact email, hosting logs, and public Currency Exchange market data. No accounts or marketing lists today.",
};

const CONTACT_EMAIL = "shangyu051601@gmail.com";

export default function PrivacyPolicyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <p>
        Exile Routes is a fan-made Path of Exile market-analysis tool operated
        by POE Arbitrage. This policy describes the limited information we may
        process when you visit the site or write to us. It is a practical site
        notice, not formal legal advice.
      </p>
      <p>
        We do not offer user accounts, sign-in, newsletters, or marketing lists
        today. We do not run advertising, analytics, or other tracking products
        on this site.
      </p>

      <h2>Information we may process</h2>
      <p>Depending on how you use the site, we may process:</p>
      <ul>
        <li>
          <strong>Email you send us.</strong> If you contact{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>, we receive
          the address you write from, the message, and any details you include.
          We use that only to read and reply.
        </li>
        <li>
          <strong>Hosting and server logs.</strong> Our host may record
          standard request metadata such as IP address, user agent, requested
          URL, and timestamps. These logs exist to operate, secure, and debug
          the site, not to build profiles.
        </li>
        <li>
          <strong>Public market data.</strong> We store Path of Exile Currency
          Exchange snapshots (historical hourly digests from the official API).
          That data is public market information, not personal information about
          you.
        </li>
      </ul>
      <p>
        The browser never calls Grinding Gear Games on your behalf. Market
        snapshots are fetched server-side and stored for the product.
      </p>

      <h2>Processors</h2>
      <p>
        We use third parties to host the site and store market data. They
        process information on our behalf only as needed to provide those
        services:
      </p>
      <ul>
        <li>
          <strong>Vercel</strong> hosts the website and may generate the
          request logs described above.
        </li>
        <li>
          <strong>Supabase</strong> stores public Currency Exchange snapshots
          used by Exile Routes. It does not hold player accounts for this
          product.
        </li>
      </ul>

      <h2>Cookies</h2>
      <p>
        We do not set advertising, analytics, or social cookies. The host may
        still set strictly necessary or platform cookies (for example security,
        routing, or preview). See the{" "}
        <Link href="/legal/cookies">Cookie Policy</Link> for that detail.
      </p>

      <h2>We do not sell personal data</h2>
      <p>
        We do not sell personal data. We do not share contact email or logs
        with advertisers. Processors receive only what they need to host the
        site and store public market snapshots.
      </p>

      <h2>Retention</h2>
      <ul>
        <li>
          Contact emails are kept only as long as needed to handle the
          conversation and any follow-up, then deleted or archived with
          ordinary mailbox practice.
        </li>
        <li>
          Hosting logs follow the host’s default retention unless we delete them
          sooner while investigating an issue.
        </li>
        <li>
          Public market snapshots are kept for the product (analysis and
          historical views) and are not treated as personal data.
        </li>
      </ul>

      <h2>Contact</h2>
      <p>
        Questions about this policy, or a request about email you sent us, go
        to{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>

      <h2>Changes</h2>
      <p>
        We will update this page if we add accounts, analytics, advertising, or
        other processing that is not described here. The “Last updated” date at
        the top of the page will change when we do.
      </p>
    </LegalPage>
  );
}
