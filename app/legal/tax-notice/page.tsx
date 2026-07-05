import type { Metadata } from "next";
import { nonprofit } from "@/lib/nonprofit";

export const metadata: Metadata = { title: "Tax Notice · Battarbox" };

export default function TaxNoticePage() {
  return (
    <>
      <h1>Tax Notice</h1>
      <p className="updated">{nonprofit.policyReviewedText}</p>

      <h2>Bartering may be taxable</h2>
      <p>
        Barter transactions may have tax consequences. Members are responsible for determining and reporting the fair
        market value of any goods or services they receive or provide.
      </p>

      <h2>What Battarbox does and does not do</h2>
      <ul>
        <li>Battarbox does not assign values, track completed exchanges, maintain barter ledgers, or issue tax forms for member-to-member exchanges.</li>
        <li>Battarbox does not provide payment processing between members, escrow, settlement, stored value, credits, or marketplace payouts.</li>
        <li>Battarbox does not provide tax advice. Consult a qualified tax professional about your situation.</li>
      </ul>

      <h2>Platform support payments</h2>
      <p>
        Support payments to {nonprofit.publicName} may or may not be tax-deductible depending on{" "}
        {nonprofit.publicName}'s tax status and the payer's circumstances. Do not claim a deduction unless you have
        confirmed eligibility with a qualified tax professional.
      </p>
      <p>
        Questions about support payments or records: contact {nonprofit.supportEmail}.
      </p>
    </>
  );
}
