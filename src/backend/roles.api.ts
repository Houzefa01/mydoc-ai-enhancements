import { supabase } from "@/integrations/supabase/client";

export type AppRole = "user" | "admin";

export const rolesApi = {
  /**
   * Rôles du compte connecté. Sert uniquement à afficher (ou masquer) l'entrée
   * d'administration : toute action d'admin est re-vérifiée côté serveur.
   */
  async listOwn(userId: string): Promise<AppRole[]> {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    return ((data ?? []) as { role: AppRole }[]).map((r) => r.role);
  },
};