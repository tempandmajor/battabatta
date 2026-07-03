import type { Metadata } from "next";

export const metadata: Metadata = { title: "Tax Notice · Battarbox" };

export default function TaxNoticePage() {
  return (
    <>
      <h1>Tax Notice</h1>
      <p className="updated">Version 2026-07-02-draft · Last updated July 2, 2026</p>

      <h2>Bartering may be taxable</h2>
      <p>
        In many jurisdictions, including the United States, the fair market value of goods or services you receive
        through bartering can be taxable income, even when no money changes hands. You are solely responsible for
        determining, reporting, and paying any taxes that apply to your exchanges.
      </p>

      <h2>What Battarbox does and does not do</h2>
      <ul>
        <li>Battarbox does not record whether exchanges were completed, does not assign values to goods or services, and does not maintain exchange ledgers or credits.</li>
        <li>Because Battarbox is not a barter exchange operator that settles transactions, it does not issue tax forms (such as US Form 1099-B) for member trades. This position should be confirmed by OMS2's tax counsel.</li>
        <li>Battarbox does not provide tax advice. Consult a qualified tax professional about your situation.</li>
      </ul>

      <h2>Platform donations</h2>
      <p>
        Donations and supporter memberships go to OMS2 to run the platform. Whether they are tax-deductible depends on
        OMS2's nonprofit status in your jurisdiction — check your Stripe receipt and OMS2's published status before
        claiming a deduction.
      </p>
    </>
  );
}
