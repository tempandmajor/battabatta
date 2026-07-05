import type { Metadata } from "next";
import { nonprofit } from "@/lib/nonprofit";

export const metadata: Metadata = { title: "Terms of Use · Battarbox" };

export default function TermsPage() {
  return (
    <>
      <h1>Terms of Use</h1>
      <p className="updated">{nonprofit.policyReviewedText}</p>

      <h2>1. What Battarbox is</h2>
      <p>
        Battarbox is a free community listing and messaging platform operated by {nonprofit.publicName}. It helps
        adults publish listings, discover possible barter opportunities, and discuss non-binding member-to-member
        arrangements through messaging.
      </p>

      <h2>2. What Battarbox is not</h2>
      <p>
        Battarbox does not provide payment processing between users, escrow, settlement, valuation, shipping,
        completion accounting, credits, stored value, exchange ledgers, marketplace payouts, dispute resolution, or
        tax, legal, or safety services for member exchanges. Offers made on Battarbox are conversation records, not
        contracts. Whether, where, and how you meet or exchange goods or services is entirely your decision and your
        responsibility.
      </p>

      <h2>3. Eligibility</h2>
      <p>
        You must be at least 18 years old to use Battarbox. By creating an account you confirm your age and agree to
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
        <li>No commercial marketplace behavior: Battarbox is for personal, non-monetary exchange discovery.</li>
        <li>No harassment, hate, spam, deception, scraping, or attempts to bypass safety controls (including blocks).</li>
        <li>Never ask another member for payment, deposits, or fees as part of an exchange.</li>
        <li>Do not post other people's personal information, or your own precise address.</li>
      </ul>

      <h2>6. Content and license</h2>
      <p>
        You keep ownership of the content you post. You grant {nonprofit.publicName} a non-exclusive, worldwide,
        royalty-free license to host, display, and distribute that content solely to operate and improve the service.
        You represent that you have the rights to everything you post. See <a href="/legal/dmca">Copyright &amp; DMCA</a>{" "}
        for infringement reports.
      </p>

      <h2>7. Moderation</h2>
      <p>
        We may remove content, restrict features, or suspend accounts that violate these Terms or create risk for the
        community, with or without notice. You can report content or members anywhere you see a Report button.
      </p>

      <h2>8. Platform support payments</h2>
      <p>
        One-time and recurring platform support payments are processed by Stripe for {nonprofit.publicName}. They
        support Battarbox operations only. They are not payments for goods or services from other Battarbox members,
        are not escrow, are not barter settlement, and do not create credits, stored value, ranking preference,
        guaranteed access to exchanges, listing boosts, or payments to other members. See the{" "}
        <a href="/legal/tax-notice">Tax Notice</a>.
      </p>

      <h2>9. Refunds and cancellations</h2>
      <p>{nonprofit.refundPolicy}</p>

      <h2>10. Advertising and invites</h2>
      <p>
        Battarbox may show clearly labeled third-party ads or sponsored placements to support the platform. Ads do not
        create endorsement by {nonprofit.publicName}, do not affect barter discovery ranking, and cannot be used to buy
        placement for a member listing. Members may invite friends by email and must not use invites for spam,
        harassment, or abuse.
      </p>

      <h2>11. Service listings and member diligence</h2>
      <p>
        Battarbox does not verify professional licenses, insurance, permits, credentials, or legal eligibility to
        provide services. Members are responsible for conducting their own due diligence before participating in any
        exchange.
      </p>

      <h2>12. Disclaimers</h2>
      <p>
        The service is provided “as is” without warranties of any kind. {nonprofit.publicName} does not vet members,
        verify listings, or inspect exchanged goods or services, and is not a party to any exchange. To the maximum
        extent permitted by law, {nonprofit.publicName}'s total liability for any claim related to the service is
        limited to USD $100.
      </p>

      <h2>13. Changes and termination</h2>
      <p>
        We may update these Terms; material changes will be announced in-app and require renewed acceptance. You may
        stop using the service at any time. Sections 6, 8, 9, 11, 12, and 14 survive account deletion.
      </p>

      <h2>14. Governing law and contact</h2>
      <p>
        These Terms are governed by the laws of the jurisdiction where {nonprofit.publicName} is organized. Questions:
        contact {nonprofit.supportEmail}.
      </p>
    </>
  );
}
