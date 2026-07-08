import { createClient } from "@supabase/supabase-js";
import { readLaunchContentPayload, upsertLaunchContentRecords } from "./lib/launch-content.mjs";

const input = process.argv[2];
if (!input) {
  console.error("Usage: npm run launch:import -- /path/to/launch-content.json");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const payload = readLaunchContentPayload(input);
const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

await upsertLaunchContentRecords(supabase, payload);

console.log(`Imported ${payload.accounts?.length ?? 0} launch profiles into staging.`);
