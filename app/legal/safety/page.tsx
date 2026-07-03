import type { Metadata } from "next";

export const metadata: Metadata = { title: "Safety Guidelines · BattaBatta" };

export default function SafetyPage() {
  return (
    <>
      <h1>Safety Guidelines</h1>
      <p className="updated">Version 2026-07-02-draft · Last updated July 2, 2026</p>

      <h2>Meeting people</h2>
      <ul>
        <li>Meet in busy public places for first exchanges — cafés, libraries, community centers.</li>
        <li>Tell a friend where you are going, or bring one.</li>
        <li>Keep your exact address private until you fully trust the other person. Posts and profiles only ever show approximate areas.</li>
        <li>Trust your instincts. You can decline, withdraw, or walk away from any exchange at any time — offers are never binding.</li>
      </ul>

      <h2>Online exchanges</h2>
      <ul>
        <li>Keep conversations in BattaBatta messages until you are comfortable; our safety tools only work here.</li>
        <li>Never send money, gift cards, deposits, or “shipping fees.” BattaBatta exchanges never involve payments between members — any payment request is a scam.</li>
        <li>Be careful with links and files from people you do not know.</li>
      </ul>

      <h2>Goods and services</h2>
      <ul>
        <li>Inspect goods before completing a trade; test electronics; check for recalls.</li>
        <li>Some services (electrical, gas, medical, childcare, legal advice) require licenses — verify credentials and see <a href="/legal/prohibited-items">Prohibited Items</a>.</li>
        <li>Food exchanges: label ingredients and allergens, and follow local cottage-food rules.</li>
      </ul>

      <h2>Tools we give you</h2>
      <ul>
        <li><strong>Block</strong> any member — they can no longer send you offers or messages, and you stop seeing each other's posts.</li>
        <li><strong>Report</strong> any profile, post, offer, or message to moderators. Reports are confidential.</li>
        <li><strong>Pause</strong> your profile when you are unavailable — your posts leave discovery instantly.</li>
        <li><strong>Availability limits</strong> with manual approval keep you in control of oversubscribed offers.</li>
      </ul>

      <h2>Emergencies</h2>
      <p>
        If you are in immediate danger, contact local emergency services first. Then report the account to us so
        moderators can act.
      </p>
    </>
  );
}
