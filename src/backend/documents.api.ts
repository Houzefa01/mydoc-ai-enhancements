import { supabase } from "@/integrations/supabase/client";
import { countWords, mapDocument, type Row } from "./mappers";
import type { DocumentContent, DocumentVersion, Section } from "./types";

export const documentsApi = {
  async list(): Promise<Record<string, DocumentContent>> {
    const { data } = await supabase.from("documents").select("*");
    const map: Record<string, DocumentContent> = {};
    for (const row of (data ?? []) as Row[]) {
      const doc = mapDocument(row);
      map[doc.projectId] = doc;
    }
    return map;
  },

  async create(
    ownerId: string,
    projectId: string,
    sections: Section[],
  ): Promise<DocumentContent | null> {
    const { data, error } = await supabase
      .from("documents")
      .insert({
        project_id: projectId,
        owner_id: ownerId,
        version: 1,
        sections: sections as unknown as Row[],
      })
      .select()
      .single();
    if (error || !data) return null;
    return mapDocument(data as Row);
  },

  async saveSections(documentId: string, sections: Section[], updatedAt: string): Promise<void> {
    await supabase
      .from("documents")
      .update({ sections: sections as unknown as Row[], updated_at: updatedAt })
      .eq("id", documentId);
  },

  async listVersions(documentId: string): Promise<DocumentVersion[]> {
    const { data } = await supabase
      .from("document_versions")
      .select("*")
      .eq("document_id", documentId)
      .order("version", { ascending: false });
    return ((data ?? []) as Row[]).map((row) => {
      const sections = (row.sections ?? []) as Section[];
      return {
        version: row.version,
        createdAt: row.created_at,
        label: row.label,
        sectionCount: sections.length,
        wordCount: countWords(sections),
      };
    });
  },

  async saveVersion(
    ownerId: string,
    documentId: string,
    version: number,
    label: string,
    sections: Section[],
  ): Promise<string | null> {
    const { error } = await supabase.from("document_versions").insert({
      document_id: documentId,
      owner_id: ownerId,
      version,
      label,
      sections: sections as unknown as Row[],
    });
    if (error) return error.message;
    await supabase.from("documents").update({ version }).eq("id", documentId);
    return null;
  },

  async getVersionSections(documentId: string, version: number): Promise<Section[] | null> {
    const { data } = await supabase
      .from("document_versions")
      .select("sections")
      .eq("document_id", documentId)
      .eq("version", version)
      .maybeSingle();
    return ((data as Row | null)?.sections ?? null) as Section[] | null;
  },
};