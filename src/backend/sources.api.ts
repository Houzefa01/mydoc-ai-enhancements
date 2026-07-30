import { supabase } from "@/integrations/supabase/client";
import { slugify } from "@/lib/exporters";
import { mapSource, type Row } from "./mappers";
import type { SourceFile } from "./types";

export function fileKind(name: string): SourceFile["type"] {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return "pdf";
  if (["doc", "docx", "odt", "rtf"].includes(ext)) return "docx";
  if (["png", "jpg", "jpeg", "webp", "gif", "heic"].includes(ext)) return "image";
  return "txt";
}

export const sourcesApi = {
  async list(): Promise<SourceFile[]> {
    const { data } = await supabase.from("source_files").select("*").order("created_at");
    return ((data ?? []) as Row[]).map(mapSource);
  },

  async add(
    ownerId: string,
    projectId: string,
    file: File,
    description?: string,
  ): Promise<{ error: string } | { file: SourceFile }> {
    if (file.size > 25_000_000) return { error: "Fichier trop lourd (25 Mo maximum)." };
    const kind = fileKind(file.name);
    const path = `${ownerId}/${projectId}/${Date.now()}-${slugify(file.name)}`;
    const { error: upErr } = await supabase.storage
      .from("sources")
      .upload(path, file, { contentType: file.type || "application/octet-stream" });
    if (upErr) return { error: upErr.message };

    let extracted = "";
    if (kind === "txt" && file.size < 500_000) {
      extracted = (await file.text()).slice(0, 20000);
    }

    const { data, error } = await supabase
      .from("source_files")
      .insert({
        project_id: projectId,
        owner_id: ownerId,
        file_name: file.name,
        size_bytes: file.size,
        type: kind,
        status: "pret",
        extracted_text: extracted,
        description: description ?? "",
        storage_path: path,
      })
      .select()
      .single();
    if (error || !data) return { error: error?.message ?? "Enregistrement impossible." };
    return { file: mapSource(data as Row) };
  },

  async updateDescription(fileId: string, description: string): Promise<void> {
    await supabase.from("source_files").update({ description }).eq("id", fileId);
  },

  async remove(fileId: string): Promise<void> {
    const { data } = await supabase
      .from("source_files")
      .select("storage_path")
      .eq("id", fileId)
      .maybeSingle();
    const path = (data as Row | null)?.storage_path;
    if (path) await supabase.storage.from("sources").remove([path]);
    await supabase.from("source_files").delete().eq("id", fileId);
  },
};