const PROHIBITED_PATTERNS = [
  { label: "weapons", pattern: /\b(?:gun|guns|firearm|firearms|ammo|ammunition|explosive|explosives)\b/i },
  { label: "drugs", pattern: /\b(?:cannabis|marijuana|weed|thc|cbd|cocaine|heroin|meth|opioid|opioids|drug paraphernalia)\b/i },
  { label: "prescription_products", pattern: /\b(?:prescription|rx|adderall|xanax|oxycodone|fentanyl)\b/i },
  { label: "alcohol_or_tobacco", pattern: /\b(?:alcohol|liquor|vodka|whiskey|tobacco|nicotine|vape|vaping)\b/i },
  { label: "adult_services", pattern: /\b(?:escort|prostitution|sexual service|adult content|porn|nude|nudes)\b/i },
  { label: "financial_or_stored_value", pattern: /\b(?:gift card|crypto|bitcoin|token|stored value|money transfer|wire transfer|loan|credit repair)\b/i },
  { label: "gambling", pattern: /\b(?:gambling|betting|raffle|sweepstakes|lottery)\b/i },
  { label: "fraud_or_abuse", pattern: /\b(?:counterfeit|fake id|fake passport|exam taking|essay writing|hacking|cracking)\b/i },
  { label: "extremism", pattern: /\b(?:hate group|extremist|terrorist)\b/i }
];

const MODERATION_ERROR =
  "This content appears to include a prohibited item, regulated service, or unsafe exchange. Revise it or contact support if this is a mistake.";

export function validatePublicContentForAdsense(fields: Array<string | null | undefined>): string | null {
  const text = fields.filter(Boolean).join(" ");
  if (!text) return null;
  return PROHIBITED_PATTERNS.some(({ pattern }) => pattern.test(text)) ? MODERATION_ERROR : null;
}

export function scanPublicContentForAdsense(fields: Array<string | null | undefined>): string[] {
  const text = fields.filter(Boolean).join(" ");
  if (!text) return [];
  return PROHIBITED_PATTERNS.filter(({ pattern }) => pattern.test(text)).map(({ label }) => label);
}
