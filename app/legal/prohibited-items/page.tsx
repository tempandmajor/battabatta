import type { Metadata } from "next";

export const metadata: Metadata = { title: "Prohibited Items & Services · BattaBatta" };

export default function ProhibitedItemsPage() {
  return (
    <>
      <h1>Prohibited Items &amp; Services</h1>
      <p className="updated">Version 2026-07-02-draft · Last updated July 2, 2026</p>

      <p>
        These may not be offered, sought, or exchanged through BattaBatta, regardless of local legality. Posts are
        removed and repeat violations lead to account suspension. When in doubt, do not list it.
      </p>

      <h2>Always prohibited</h2>
      <ul>
        <li>Weapons, firearms, ammunition, explosives, and weapon parts or kits.</li>
        <li>Illegal drugs, drug paraphernalia, and prescription medications or medical devices.</li>
        <li>Alcohol, tobacco, nicotine, vaping products, and cannabis (including where locally legal).</li>
        <li>Live animals and animal parts restricted by wildlife protection laws.</li>
        <li>Stolen goods, counterfeit items, and items subject to recall.</li>
        <li>Hazardous materials and chemicals.</li>
        <li>Sexual services, sexually explicit material, and any adult content involving exchange.</li>
        <li>Human remains, bodily fluids, and organs.</li>
        <li>Identity documents, government IDs, financial instruments, gift cards, and cryptocurrency.</li>
        <li>Anything requiring a transfer of money between members — BattaBatta is barter-only.</li>
      </ul>

      <h2>Prohibited services</h2>
      <ul>
        <li>Services that are illegal or facilitate illegal activity.</li>
        <li>Regulated professional services offered without the required license where a license is legally required
          (e.g., medical or mental-health treatment, legal representation, gas or high-voltage electrical work).</li>
        <li>Academic fraud (writing essays or exams for others), and impersonation or fake-review services.</li>
        <li>Childcare or eldercare arrangements that evade local regulation.</li>
      </ul>

      <h2>Restricted with care</h2>
      <ul>
        <li>Homemade food: follow local cottage-food laws and label allergens.</li>
        <li>Car seats, helmets, and other safety equipment: only if undamaged and within expiry.</li>
        <li>Transportation or ride help: personal favors only, never a taxi-style service.</li>
      </ul>

      <p>
        See a listing that breaks these rules? Use the Report button on the post — moderators review every report.
      </p>
    </>
  );
}
