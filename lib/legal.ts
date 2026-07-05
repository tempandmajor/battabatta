// Versions recorded in legal_consents when a member accepts a document.
// Bump when the corresponding page under app/legal changes materially.

export const LEGAL_DOCUMENT_VERSIONS = {
  terms: "2026-07-reviewed",
  privacy: "2026-07-reviewed"
} as const;

export type LegalDocumentKey = keyof typeof LEGAL_DOCUMENT_VERSIONS;
