import { supabase } from "@/integrations/supabase/client";
import { mapProject, type Row } from "./mappers";
import type { DocumentType, Project, ProjectStatus } from "./types";

export const projectsApi = {
  async list(): Promise<Project[]> {
    const { data } = await supabase
      .from("projects")
      .select("*")
      .order("updated_at", { ascending: false });
    return ((data ?? []) as Row[]).map(mapProject);
  },

  async create(
    ownerId: string,
    input: {
      title: string;
      description: string;
      type: DocumentType;
      brief?: Record<string, string>;
    },
  ): Promise<Project | null> {
    const { data, error } = await supabase
      .from("projects")
      .insert({
        owner_id: ownerId,
        title: input.title,
        description: input.description,
        type: input.type,
        status: "brouillon",
        brief: (input.brief ?? {}) as unknown as Row,
      })
      .select()
      .single();
    if (error || !data) return null;
    return mapProject(data as Row);
  },

  async setStatus(projectId: string, status: ProjectStatus): Promise<void> {
    await supabase
      .from("projects")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", projectId);
  },

  async remove(projectId: string): Promise<void> {
    await supabase.from("projects").delete().eq("id", projectId);
  },
};