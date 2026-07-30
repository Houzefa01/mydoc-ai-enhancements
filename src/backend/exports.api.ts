import { supabase } from "@/integrations/supabase/client";
import { buildExport, downloadBlob, slugify } from "@/lib/exporters";
import { mapExport, type Row } from "./mappers";
import type { DocumentType, ExportFormat, ExportJob, Section } from "./types";

export const exportsApi = {
  async list(): Promise<ExportJob[]> {
    const { data } = await supabase
      .from("export_jobs")
      .select("*")
      .order("created_at", { ascending: false });
    return ((data ?? []) as Row[]).map(mapExport);
  },

  async createJob(
    ownerId: string,
    documentId: string,
    format: ExportFormat,
  ): Promise<{ error: string } | { job: ExportJob }> {
    const { data, error } = await supabase
      .from("export_jobs")
      .insert({ document_id: documentId, owner_id: ownerId, format, status: "en_cours" })
      .select()
      .single();
    if (error || !data) return { error: error?.message ?? "Export impossible." };
    return { job: mapExport(data as Row) };
  },

  /** Builds the file client-side, stores it, then marks the job as ready. */
  async runJob(
    ownerId: string,
    jobId: string,
    format: ExportFormat,
    payload: {
      title: string;
      description: string;
      type: DocumentType;
      author?: string;
      sections: Section[];
    },
  ): Promise<{ error: string } | { path: string }> {
    try {
      const built = buildExport(format, payload);
      const path = `${ownerId}/${slugify(payload.title)}-${jobId}.${built.extension}`;
      const { error: upErr } = await supabase.storage
        .from("exports")
        .upload(path, built.blob, { contentType: built.mimeType, upsert: true });
      if (upErr) throw new Error(upErr.message);
      await supabase
        .from("export_jobs")
        .update({ status: "pret", file_url: path, error_message: null })
        .eq("id", jobId);
      return { path };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Échec de la conversion.";
      await supabase
        .from("export_jobs")
        .update({ status: "echec", error_message: message })
        .eq("id", jobId);
      return { error: message };
    }
  },

  async download(path: string): Promise<string | null> {
    const { data, error } = await supabase.storage.from("exports").download(path);
    if (error || !data) return error?.message ?? "Téléchargement impossible.";
    downloadBlob(data, path.split("/").pop() ?? "document");
    return null;
  },

  async remove(jobId: string, path?: string): Promise<void> {
    if (path) await supabase.storage.from("exports").remove([path]);
    await supabase.from("export_jobs").delete().eq("id", jobId);
  },
};