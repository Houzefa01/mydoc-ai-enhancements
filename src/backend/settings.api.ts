import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_SETTINGS, type SystemSettings } from "./settings.types";

/**
 * Lecture des paramètres globaux côté application (tarification + modèle
 * actif). Aucune clé d'API n'est stockée dans cette table : elle reste
 * exclusivement côté serveur.
 */
export const settingsApi = {
  async get(): Promise<SystemSettings> {
    const { data } = await supabase
      .from("system_settings")
      .select("*")
      .eq("id", "global")
      .maybeSingle();
    if (!data) return DEFAULT_SETTINGS;
    const row = data as Record<string, unknown>;
    return {
      tokensPerCredit: Number(row.tokens_per_credit) || DEFAULT_SETTINGS.tokensPerCredit,
      creditPrice: Number(row.credit_price) || 0,
      aiProvider: String(row.ai_provider ?? DEFAULT_SETTINGS.aiProvider),
      aiModel: String(row.ai_model ?? DEFAULT_SETTINGS.aiModel),
      updatedAt: String(row.updated_at ?? ""),
    };
  },
};