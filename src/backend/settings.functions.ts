import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  SETTING_LABELS,
  type ProviderKeyStatus,
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
      settingLabel:
        SETTING_LABELS[r.setting_key] ??
        (r.setting_key.startsWith("api_key_test_")
          ? `Test de clé — ${r.setting_key.replace("api_key_test_", "")}`
          : r.setting_key.startsWith("api_key_")
          ? `Clé d'API — ${r.setting_key.replace("api_key_", "")}`
          : r.setting_key),
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

/**
 * État des clés d'API par fournisseur : jamais la valeur, seulement un aperçu
 * masqué (4 derniers caractères) et la provenance.
 */
export const adminListProviderKeys = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ProviderKeyStatus[]> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { PROVIDERS } = await import("./ai.server");
    const { data } = await supabaseAdmin.from("provider_api_keys").select("*");
    const rows = (data ?? []) as {
      provider: string;
      api_key: string;
      updated_by_email: string | null;
      updated_at: string;
    }[];
    return Object.entries(PROVIDERS).map(([id, p]) => {
      const row = rows.find((r) => r.provider === id);
      const envKey = process.env[p.keyEnv];
      const value = row?.api_key?.trim() || envKey || "";
      return {
        provider: id,
        label: p.label,
        configured: Boolean(value),
        source: (row?.api_key?.trim()
          ? "interface"
          : envKey
            ? "environnement"
            : "aucune") as ProviderKeyStatus["source"],
        masked: value ? `••••${value.slice(-4)}` : "",
        updatedByEmail: row?.updated_by_email ?? "",
        updatedAt: row?.updated_at ?? "",
      };
    });
  });

/** Enregistre ou remplace la clé d'API d'un fournisseur (admin uniquement). */
export const adminSetProviderKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { provider: string; apiKey: string }) => {
    if (!data.apiKey || data.apiKey.trim().length < 8)
      throw new Error("La clé d'API semble incomplète.");
    return { provider: data.provider, apiKey: data.apiKey.trim() };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { PROVIDERS } = await import("./ai.server");
    if (!PROVIDERS[data.provider]) throw new Error("Fournisseur IA inconnu.");

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email")
      .eq("id", context.userId)
      .maybeSingle();

    const { error } = await supabaseAdmin.from("provider_api_keys").upsert(
      {
        provider: data.provider,
        api_key: data.apiKey,
        updated_by: context.userId,
        updated_by_email: profile?.email ?? "",
        updated_at: new Date().toISOString(),
      } as never,
      { onConflict: "provider" },
    );
    if (error) throw new Error(error.message);

    // Historique : on trace le changement sans jamais y écrire la clé.
    await supabaseAdmin.from("system_settings_history").insert({
      setting_key: `api_key_${data.provider}`,
      old_value: "",
      new_value: `clé mise à jour (••••${data.apiKey.slice(-4)})`,
      changed_by: context.userId,
      changed_by_email: profile?.email ?? "",
    } as never);

    return { ok: true };
  });

/** Supprime la clé saisie dans l'interface (le repli d'environnement subsiste). */
export const adminTestProviderKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { provider: string; apiKey?: string }) => ({
    provider: data.provider,
    apiKey: (data.apiKey ?? "").trim(),
  }))
  .handler(async ({ data, context }): Promise<{ ok: boolean; message: string }> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { PROVIDERS, verifyProviderKey } = await import("./ai.server");
    if (!PROVIDERS[data.provider]) throw new Error("Fournisseur IA inconnu.");

    const result = await verifyProviderKey(data.provider, data.apiKey);

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email")
      .eq("id", context.userId)
      .maybeSingle();

    // Audit : uniquement le résultat et un aperçu masqué, jamais la clé.
    await supabaseAdmin.from("system_settings_history").insert({
      setting_key: `api_key_test_${data.provider}`,
      old_value: data.apiKey ? "clé saisie (non enregistrée)" : "clé enregistrée",
      new_value: `${result.ok ? "valide" : "invalide"}${result.masked ? ` (${result.masked})` : ""} — ${result.message}`,
      changed_by: context.userId,
      changed_by_email: profile?.email ?? "",
    } as never);

    return { ok: result.ok, message: result.message };
  });

/** Supprime la clé saisie dans l'interface (le repli d'environnement subsiste). */
export const adminDeleteProviderKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { provider: string }) => data)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("provider_api_keys").delete().eq("provider", data.provider);
    return { ok: true };
  });