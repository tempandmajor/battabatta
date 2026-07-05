import type { Metadata } from "next";
import { nonprofit } from "@/lib/nonprofit";

export const metadata: Metadata = { title: "Prohibited Items & Services · Battarbox" };

export default function ProhibitedItemsPage() {
  return (
    <>
      <h1>Prohibited Items &amp; Services</h1>
      <p className="updated">{nonprofit.policyReviewedText}</p>

      <p>
        These may not be offered, sought, or exchanged through Battarbox, regardless of local legality. Battarbox may
        remove listings, restrict accounts, suspend accounts, block access, or report activity when listings violate
        this policy. When in doubt, do not list it.
      </p>

      <h2>Always prohibited</h2>
      <ul>
        <li>Weapons, firearms, ammunition, explosives, weapon accessories, weapon parts, or weapon kits.</li>
        <li>Illegal drugs, controlled substances, drug paraphernalia, cannabis, CBD, THC, and cannabis-related products, including where locally legal.</li>
        <li>Prescription medication, regulated medical products, medical devices that require authorization, or products making regulated medical claims.</li>
        <li>Alcohol, tobacco, nicotine, and vaping products.</li>
        <li>Live animals and animal parts restricted by wildlife protection laws.</li>
        <li>Stolen goods, counterfeit goods, recalled products, and goods the member does not have the right to offer.</li>
        <li>Hazardous chemicals, hazardous materials, explosives, toxins, or regulated substances.</li>
        <li>Adult sexual services, explicit sexual content, and any adult content involving exchange.</li>
        <li>Human remains, bodily fluids, and organs.</li>
        <li>Gift cards, cash equivalents, money transfers, crypto, tokens, stored value, financial products, credit products, investment products, or payment instruments.</li>
        <li>Gambling, betting, raffles, sweepstakes, games of chance, or prize contests requiring payment or consideration.</li>
        <li>Hate, extremist, violent, exploitative, or illegal content.</li>
        <li>Anything requiring licenses, permits, background checks, professional credentials, or eligibility that Battarbox does not verify.</li>
        <li>Anything requiring a transfer of money between members. Battarbox is a discovery and messaging platform, not a payment, escrow, or settlement service.</li>
      </ul>

      <h2>Prohibited services</h2>
      <ul>
        <li>Services that are illegal or facilitate illegal activity.</li>
        <li>Regulated professional services where Battarbox cannot verify required licenses, permits, insurance, credentials, or legal eligibility.</li>
        <li>Academic fraud (writing essays or exams for others), and impersonation or fake-review services.</li>
        <li>Childcare or eldercare arrangements that evade local regulation.</li>
      </ul>

      <h2>Licensing and member responsibility</h2>
      <p>
        Battarbox does not verify professional licenses, insurance, permits, credentials, or legal eligibility to
        provide services. Members are responsible for conducting their own due diligence before participating in any
        exchange.
      </p>

      <h2>Restricted with care</h2>
      <ul>
        <li>Homemade food: follow local cottage-food laws and label allergens.</li>
        <li>Car seats, helmets, and other safety equipment: only if undamaged and within expiry.</li>
        <li>Transportation or ride help: personal favors only, never a taxi-style service.</li>
      </ul>

      <p>
        See a listing that breaks these rules? Use the Report button on the post or contact {nonprofit.supportEmail}.
        Moderators review reports and may remove listings, restrict accounts, or report activity when appropriate.
      </p>
    </>
  );
}
