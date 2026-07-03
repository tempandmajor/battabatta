import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp"
};

/**
 * Uploads an image to a public bucket under the caller's folder
 * ("<user_id>/<random>.<ext>", enforced by storage RLS) and returns the path.
 * Returns null when no file was selected; throws a friendly Error otherwise.
 */
export async function uploadImage(
  supabase: SupabaseClient<Database>,
  bucket: "avatars" | "post-photos",
  userId: string,
  file: FormDataEntryValue | null
): Promise<string | null> {
  if (!(file instanceof File) || file.size === 0) return null;

  const extension = ALLOWED_IMAGE_TYPES[file.type];
  if (!extension) throw new Error("Photos must be JPEG, PNG, or WebP");
  if (file.size > MAX_IMAGE_BYTES) throw new Error("Photos must be 5 MB or smaller");

  const path = `${userId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type,
    cacheControl: "31536000"
  });
  if (error) throw new Error(`Photo upload failed: ${error.message}`);
  return path;
}
