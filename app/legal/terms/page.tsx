import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of Use · BattaBatta" };

export default function TermsPage() {
  return (
    <>
      <h1>Terms of Use</h1>
      <p className="updated">Version 2026-07-02-draft · Last updated July 2, 2026</p>

      <h2>1. What BattaBatta is</h2>
      <p>
        BattaBatta is an open-source, nonprofit-owned barter discovery service operated by OMS2. It helps adults
        publish what they can offer, describe what they are seeking, discover local or online opportunities, and
        negotiate non-binding exchanges through messaging.
      </p>

      <h2>2. What BattaBatta is not</h2>
      <p>
        BattaBatta does not provide payment processing between users, escrow, settlement, valuation, shipping,
        completion accounting, credits, exchange ledgers, dispute resolution, or tax, legal, or safety services for
        user exchanges. Offers made on BattaBatta are conversation records, not contracts. Whether, where, and how you
        meet or exchange goods or services is entirely your decision and your responsibility.
      </p>

      <h2>3. Eligibility</h2>
      <p>
        You must be at least 18 years old to use BattaBatta. By creating an account you confirm your age and agree to
        these Terms and the <a href="/legal/privacy">Privacy Policy</a>.
      </p>

      <h2>4. Your account</h2>
      <ul>
        <li>You are responsible for your account credentials and everything posted from your account.</li>
        <li>Provide accurate information and keep only one active account.</li>
        <li>You may pause your offers or delete your account at any time from Settings.</li>
      </ul>

      <h2>5. Acceptable use</h2>
      <ul>
        <li>Only list goods and services you can lawfully offer. See <a href="/legal/prohibited-items">Prohibited Items</a>.</li>
        <li>No commercial marketplace behavior: BattaBatta is for personal, non-monetary exchange discovery.</li>
        <li>No harassment, hate, spam, deception, scraping, or attempts to bypass safety controls (including blocks).</li>
        <li>Never ask another member for payment, deposits, or fees as part of an exchange.</li>
        <li>Do not post other people's personal information, or your own precise address.</li>
      </ul>

      <h2>6. Content and license</h2>
      <p>
        You keep ownership of the content you post. You grant OMS2 a non-exclusive, worldwide, royalty-free license to
        host, display, and distribute that content solely to operate and improve the service. You represent that you
        have the rights to everything you post. See <a href="/legal/dmca">Copyright &amp; DMCA</a> for infringement
        reports.
      </p>

      <h2>7. Moderation</h2>
      <p>
        We may remove content, restrict features, or suspend accounts that violate these Terms or create risk for the
        community, with or without notice. You can report content or members anywhere you see a Report button.
      </p>

      <h2>8. Platform support payments</h2>
      <p>
        Donations and supporter memberships are processed by Stripe, support the OMS2 platform only, never buy
        placement in barter discovery, and are never payments to another user for an exchange. See the{" "}
        <a href="/legal/tax-notice">Tax Notice</a>.
      </p>

      <h2>9. Disclaimers</h2>
      <p>
        The service is provided “as is” without warranties of any kind. OMS2 does not vet members, verify listings, or
        inspect exchanged goods or services, and is not a party to any exchange. To the maximum extent permitted by
        law, OMS2's total liability for any claim related to the service is limited to USD $100.
      </p>

      <h2>10. Changes and termination</h2>
      <p>
        We may update these Terms; material changes will be announced in-app and require renewed acceptance. You may
        stop using the service at any time. Sections 6, 9, and 11 survive account deletion.
      </p>

      <h2>11. Governing law and contact</h2>
      <p>
        These Terms are governed by the laws of the jurisdiction where OMS2 is organized (to be confirmed by counsel).
        Questions: contact OMS2 at the address published on the project repository.
      </p>
    </>
  );
}
