import { supabase } from "@/integrations/supabase/client";
import { mapProfile, type Row } from "./mappers";
import type { User } from "./types";

export async function resolveAvatar(path?: string | null): Promise<string | undefined> {
  if (!path) return undefined;
  if (path.startsWith("http")) return path;
  const { data } = await supabase.storage.from("avatars").createSignedUrl(path, 3600);
  return data?.signedUrl;
}

export const profileApi = {
  async get(userId: string): Promise<{ user: User; avatarPath: string | null } | null> {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    const row = data as Row | null;
    if (!row) return null;
    return {
      user: mapProfile(row, await resolveAvatar(row.avatar_url)),
      avatarPath: row.avatar_url ?? null,
    };
  },

  async update(userId: string, patch: Partial<User>): Promise<string | null> {
    const payload: Row = {};
    if (patch.name !== undefined) payload.name = patch.name;
    if (patch.birthDate !== undefined) payload.birth_date = patch.birthDate || null;
    if (patch.phone !== undefined) payload.phone = patch.phone;
    if (patch.address !== undefined) payload.address = patch.address;
    if (patch.city !== undefined) payload.city = patch.city;
    if (patch.postalCode !== undefined) payload.postal_code = patch.postalCode;
    if (patch.country !== undefined) payload.country = patch.country;
    if (patch.bio !== undefined) payload.bio = patch.bio;
    const { error } = await supabase
      .from("profiles")
      .update(payload as never)
      .eq("id", userId);
    return error?.message ?? null;
  },

  async uploadAvatar(
    userId: string,
    file: File,
    previousPath: string | null,
  ): Promise<{ error: string } | { path: string; url?: string }> {
    if (file.size > 5_000_000) return { error: "Image trop lourde (5 Mo maximum)." };
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `${userId}/avatar-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (error) return { error: error.message };
    if (previousPath && !previousPath.startsWith("http")) {
      await supabase.storage.from("avatars").remove([previousPath]);
    }
    await supabase.from("profiles").update({ avatar_url: path }).eq("id", userId);
    return { path, url: await resolveAvatar(path) };
  },
};