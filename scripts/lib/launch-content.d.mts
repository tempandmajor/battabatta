export function slug(value: string): string;

export function normalizeAvailability(value: string): {
  total: number | null;
  unit: string | null;
};

export interface LaunchContentPost {
  sourcePostNumber: number;
  title: string;
  kind: "offering" | "seeking";
  category: "goods" | "services";
  locationMode: string;
  availabilityTotal: number | null;
  availabilityUnit: string | null;
  approvalPolicy: string;
  whatICanGive: string;
  lookingFor: string;
  body: string;
  suggestedImages: string;
  batch: number;
  status: string;
}

export interface LaunchContentAccount {
  sourceIndex: number;
  displayName: string;
  suggestedHandle: string;
  setupEmail: string;
  publicRole: string;
  bio: string;
  publicLocationLabel: string | null;
  locationMode: string;
  interests: string[];
  status: string;
  posts: LaunchContentPost[];
}

export interface LaunchContentPayload {
  accounts: LaunchContentAccount[];
}

export function parseLaunchContentText(text: string): LaunchContentPayload;

export function extractDocxText(inputPath: string): string;

export function readLaunchContentPayload(inputPath: string): LaunchContentPayload;

export function upsertLaunchContentRecords(
  supabase: unknown,
  payload: LaunchContentPayload
): Promise<{
  profileIdsBySourceIndex: Map<number, string>;
  importedProfiles: unknown[];
  importedPosts: unknown[];
}>;
