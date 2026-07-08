const PROHIBITED_PATTERNS = [
  /\b(?:gun|guns|firearm|firearms|ammo|ammunition|explosive|explosives)\b/i,
  /\b(?:cannabis|marijuana|weed|thc|cbd|cocaine|heroin|meth|opioid|opioids|drug paraphernalia)\b/i,
  /\b(?:prescription|rx|adderall|xanax|oxycodone|fentanyl)\b/i,
  /\b(?:alcohol|liquor|vodka|whiskey|tobacco|nicotine|vape|vaping)\b/i,
  /\b(?:escort|prostitution|sexual service|adult content|porn|nude|nudes)\b/i,
  /\b(?:gift card|crypto|bitcoin|token|stored value|money transfer|wire transfer|loan|credit repair)\b/i,
  /\b(?:gambling|betting|raffle|sweepstakes|lottery)\b/i,
  /\b(?:counterfeit|fake id|fake passport|exam taking|essay writing|hacking|cracking)\b/i,
  /\b(?:hate group|extremist|terrorist)\b/i
];

const MODERATION_ERROR =
  "This content appears to include a prohibited item, regulated service, or unsafe exchange. Revise it or contact support if this is a mistake.";

export function validatePublicContentForAdsense(fields: Array<string | null | undefined>): string | null {
  const text = fields.filter(Boolean).join(" ");
  if (!text) return null;
  return PROHIBITED_PATTERNS.some((pattern) => pattern.test(text)) ? MODERATION_ERROR : null;
}
