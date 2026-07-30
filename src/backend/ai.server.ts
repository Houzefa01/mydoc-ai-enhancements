/**
 * Couche d'abstraction unique du fournisseur IA (serveur uniquement).
 *
 * La clé d'API ne quitte jamais le serveur : seul l'identifiant du modèle
 * sélectionné est visible côté client. Changer de fournisseur consiste à
 * ajouter une entrée dans `PROVIDERS` — rien d'autre dans l'application ne
 * connaît le détail des endpoints.
 */

export interface ProviderConfig {
  label: string;
  /** Endpoint de liste des modèles du fournisseur. */
  modelsUrl: string;
  /** Base des complétions (compatible OpenAI pour tous les fournisseurs listés). */
  chatUrl: string;
  /** Nom de la variable d'environnement contenant la clé d'API. */
  keyEnv: string;
}

export const PROVIDERS: Record<string, ProviderConfig> = {
  deepseek: {
    label: "DeepSeek",
    modelsUrl: "https://api.deepseek.com/models",
    chatUrl: "https://api.deepseek.com/chat/completions",
    keyEnv: "DEEPSEEK_API_KEY",
  },
  openai: {
    label: "OpenAI",
    modelsUrl: "https://api.openai.com/v1/models",
    chatUrl: "https://api.openai.com/v1/chat/completions",
    keyEnv: "OPENAI_API_KEY",
  },
  mistral: {
    label: "Mistral",
    modelsUrl: "https://api.mistral.ai/v1/models",
    chatUrl: "https://api.mistral.ai/v1/chat/completions",
    keyEnv: "MISTRAL_API_KEY",
  },
  lovable: {
    label: "Lovable AI",
    modelsUrl: "https://ai.gateway.lovable.dev/v1/models",
    chatUrl: "https://ai.gateway.lovable.dev/v1/chat/completions",
    keyEnv: "LOVABLE_API_KEY",
  },
};

function providerOrThrow(provider: string): ProviderConfig {
  const config = PROVIDERS[provider];
  if (!config) throw new Error(`Fournisseur IA inconnu : « ${provider} ».`);
  return config;
}

function apiKeyOrThrow(config: ProviderConfig): string {
  const key = process.env[config.keyEnv];
  if (!key)
    throw new Error(
      `Clé d'API absente pour ${config.label} : ajoutez le secret ${config.keyEnv} côté serveur.`,
    );
  return key;
}

/** Liste, en direct, les modèles réellement disponibles chez le fournisseur. */
export async function listProviderModels(provider: string): Promise<string[]> {
  const config = providerOrThrow(provider);
  const key = apiKeyOrThrow(config);

  let response: Response;
  try {
    response = await fetch(config.modelsUrl, {
      headers: { Authorization: `Bearer ${key}` },
    });
  } catch {
    throw new Error(`Impossible de joindre l'API ${config.label}.`);
  }

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 200);
    throw new Error(
      `L'API ${config.label} a répondu ${response.status}${detail ? ` — ${detail}` : ""}.`,
    );
  }

  const payload = (await response.json()) as { data?: { id?: string }[] };
  const models = (payload.data ?? [])
    .map((m) => m.id)
    .filter((id): id is string => Boolean(id))
    .sort((a, b) => a.localeCompare(b));
  if (models.length === 0) throw new Error(`L'API ${config.label} n'a renvoyé aucun modèle.`);
  return models;
}

/**
 * Configuration de génération lue à chaque appel : un changement de modèle
 * dans l'espace admin prend effet immédiatement, sans redéploiement.
 */
export async function resolveGenerationConfig(): Promise<{
  provider: ProviderConfig;
  providerId: string;
  model: string;
  apiKey: string;
}> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("system_settings")
    .select("ai_provider, ai_model")
    .eq("id", "global")
    .maybeSingle();
  const providerId = data?.ai_provider ?? "deepseek";
  const config = providerOrThrow(providerId);
  return {
    provider: config,
    providerId,
    model: data?.ai_model ?? "deepseek-chat",
    apiKey: apiKeyOrThrow(config),
  };
}