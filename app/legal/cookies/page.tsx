import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description:
    "How Exile Routes uses cookies: no advertising, analytics, or social cookies today. Strictly necessary platform cookies may be set by our host.",
};

export default function CookiePolicyPage() {
  return (
    <LegalPage title="Cookie Policy">
      <p>
        This Cookie Policy explains how Exile Routes, operated by POE Arbitrage
        (“we”, “us”), uses cookies and similar technologies when you visit this
        site. It describes current practice and is not formal legal advice.
      </p>
      <p>
        For how we handle personal data more generally — including emails you
        send us and standard hosting logs — see our{" "}
        <Link href="/legal/privacy">Privacy Policy</Link>.
      </p>

      <h2>What we do not use today</h2>
      <p>
        We do not currently use advertising cookies, analytics cookies, or
        social-media cookies. There are no ads on this site, no marketing
        pixels, and no third-party analytics tools that set cookies in your
        browser.
      </p>
      <p>
        We do not operate user accounts, so we do not set cookies to keep you
        signed in or to remember a logged-in session.
      </p>

      <h2>Strictly necessary and platform cookies</h2>
      <p>
        Our hosting platform (Vercel) may set strictly necessary or
        infrastructure cookies so the site can be served securely. These can
        include cookies used for:
      </p>
      <ul>
        <li>Security and abuse prevention</li>
        <li>Routing and load balancing</li>
        <li>Preview or protected deployments</li>
      </ul>
      <p>
        These cookies are typically set by the platform rather than by Exile
        Routes application code. They are not used to advertise to you or to
        build a marketing profile.
      </p>

      <h2>How to control cookies</h2>
      <p>
        You can control cookies through your browser settings. Most browsers
        let you block or delete cookies, or set rules for particular sites.
        Check your browser’s help documentation for the steps that apply to
        you.
      </p>
      <p>
        Blocking strictly necessary cookies may affect how the site loads or
        how preview and security features work. Analytics and advertising
        cookies are not in use today, so turning those categories off in a
        browser or extension should not change Exile Routes’ current behaviour.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        If we add analytics, advertising, or other tracking cookies in the
        future, we will update this Cookie Policy (and the Privacy Policy where
        relevant) before or when that happens.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about cookies:{" "}
        <a href="mailto:shangyu051601@gmail.com">shangyu051601@gmail.com</a>.
      </p>
    </LegalPage>
  );
}
