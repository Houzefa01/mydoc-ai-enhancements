import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  SETTING_LABELS,
  type SettingsHistoryEntry,
  type SystemSettings,
} from "./settings.types";

/** Lève une erreur si l'appelant n'a pas le rôle `admin` (vérification serveur). */
async function assertAdmin(context: {
  supabase: { from: (t: string) => any };
  userId: string;
}): Promise<void> {
  const { data } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Accès refusé : rôle administrateur requis.");
}

export const adminGetSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SystemSettings & { providers: { id: string; label: string }[] }> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { PROVIDERS } = await import("./ai.server");
    const { data } = await supabaseAdmin
      .from("system_settings")
      .select("*")
      .eq("id", "global")
      .maybeSingle();
    return {
      tokensPerCredit: Number(data?.tokens_per_credit ?? 8000),
      creditPrice: Number(data?.credit_price ?? 0),
      aiProvider: String(data?.ai_provider ?? "deepseek"),
      aiModel: String(data?.ai_model ?? ""),
      updatedAt: String(data?.updated_at ?? ""),
      providers: Object.entries(PROVIDERS).map(([id, p]) => ({ id, label: p.label })),
    };
  });

export const adminUpdateSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      tokensPerCredit?: number;
      creditPrice?: number;
      aiProvider?: string;
      aiModel?: string;
    }) => {
      if (data.tokensPerCredit !== undefined) {
        if (!Number.isInteger(data.tokensPerCredit) || data.tokensPerCredit <= 0)
          throw new Error("Le nombre de tokens par crédit doit être un entier positif.");
      }
      if (data.creditPrice !== undefined) {
        if (!Number.isFinite(data.creditPrice) || data.creditPrice < 0)
          throw new Error("Le prix d'un crédit doit être un nombre positif.");
      }
      return data;
    },
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { PROVIDERS } = await import("./ai.server");

    if (data.aiProvider && !PROVIDERS[data.aiProvider])
      throw new Error("Fournisseur IA inconnu.");

    const { data: current } = await supabaseAdmin
      .from("system_settings")
      .select("*")
      .eq("id", "global")
      .maybeSingle();

    const patch: Record<string, unknown> = {};
    const changes: { key: string; oldValue: string; newValue: string }[] = [];
    const consider = (key: string, next: unknown) => {
      if (next === undefined) return;
      const before = String((current as Record<string, unknown> | null)?.[key] ?? "");
      const after = String(next);
      if (Number(before) === Number(after) && before !== "" && !Number.isNaN(Number(before))) return;
      if (before === after) return;
      patch[key] = next;
      changes.push({ key, oldValue: before, newValue: after });
    };

    consider("tokens_per_credit", data.tokensPerCredit);
    consider("credit_price", data.creditPrice);
    consider("ai_provider", data.aiProvider);
    consider("ai_model", data.aiModel);

    if (changes.length === 0) return { changed: 0 };

    const { error } = await supabaseAdmin
      .from("system_settings")
      .update(patch as never)
      .eq("id", "global");
    if (error) throw new Error(error.message);

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email")
      .eq("id", context.userId)
      .maybeSingle();

    await supabaseAdmin.from("system_settings_history").insert(
      changes.map((c) => ({
        setting_key: c.key,
        old_value: c.oldValue,
        new_value: c.newValue,
        changed_by: context.userId,
        changed_by_email: profile?.email ?? "",
      })) as never,
    );

    return { changed: changes.length };
  });

export const adminListSettingsHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SettingsHistoryEntry[]> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("system_settings_history")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    return (data ?? []).map((r) => ({
      id: r.id,
      settingKey: r.setting_key,
      settingLabel: SETTING_LABELS[r.setting_key] ?? r.setting_key,
      oldValue: r.old_value ?? "",
      newValue: r.new_value ?? "",
      changedByEmail: r.changed_by_email ?? "",
      createdAt: r.created_at,
    }));
  });

/** Interroge en direct l'API du fournisseur configuré. La clé reste serveur. */
export const adminListProviderModels = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { provider: string }) => data)
  .handler(async ({ data, context }): Promise<{ models: string[]; error: string | null }> => {
    await assertAdmin(context);
    const { listProviderModels } = await import("./ai.server");
    // On renvoie l'erreur au lieu de la lever : elle est affichée dans l'interface.
    try {
      return { models: await listProviderModels(data.provider), error: null };
    } catch (error) {
      return { models: [], error: (error as Error).message };
    }
  });