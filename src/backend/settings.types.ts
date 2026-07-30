/** Paramètres système globaux (aucune clé secrète n'y figure). */
export interface SystemSettings {
  /** Nombre de tokens couverts par un crédit. */
  tokensPerCredit: number;
  /** Prix d'un crédit, en dollars. */
  creditPrice: number;
  /** Fournisseur IA actif (ex. « deepseek »). */
  aiProvider: string;
  /** Modèle actif chez ce fournisseur. */
  aiModel: string;
  updatedAt: string;
}

export interface SettingsHistoryEntry {
  id: string;
  settingKey: string;
  settingLabel: string;
  oldValue: string;
  newValue: string;
  changedByEmail: string;
  createdAt: string;
}

export const SETTING_LABELS: Record<string, string> = {
  tokens_per_credit: "Tokens par crédit",
  credit_price: "Prix d'un crédit ($)",
  ai_provider: "Fournisseur IA",
  ai_model: "Modèle IA",
};

/** Valeurs de repli utilisées tant que la configuration n'est pas chargée. */
export const DEFAULT_SETTINGS: SystemSettings = {
  tokensPerCredit: 8000,
  creditPrice: 0.15,
  aiProvider: "deepseek",
  aiModel: "deepseek-chat",
  updatedAt: "",
};