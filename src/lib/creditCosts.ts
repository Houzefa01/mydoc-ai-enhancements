import type { DocumentType } from "@/backend/types";

/**
 * Coûts en crédits — source unique de vérité.
 *
 * Les coûts sont exprimés en **tokens** ; leur conversion en crédits utilise le
 * réglage « tokens par crédit » défini dans les paramètres système (espace
 * admin). Aucune valeur de crédit n'est codée en dur ailleurs dans le code.
 */

import { DEFAULT_SETTINGS } from "@/backend/settings.types";

export const DEFAULT_TOKENS_PER_CREDIT = DEFAULT_SETTINGS.tokensPerCredit;

/** Volume de tokens estimé pour une génération complète, par type de document. */
export const GENERATION_TOKEN_COST: Record<DocumentType, number> = {
  rapport: 40_000,
  resume: 24_000,
  memoire: 64_000,
  presentation: 32_000,
  // Une correction retravaille un texte déjà écrit : moins coûteux qu'une
  // rédaction complète à partir d'un plan.
  correction: 16_000,
  cv: 24_000,
  lettre_motivation: 16_000,
  lettre_demande: 16_000,
};

/** Tokens supplémentaires par tranche entamée de 1 000 mots à relire. */
export const CORRECTION_TOKENS_PER_1000_WORDS = 8_000;

/** Tokens consommés par un export, quel que soit le format. */
export const EXPORT_TOKEN_COST = 8_000;

/** Conversion tokens → crédits (arrondi à l'unité supérieure). */
export function creditsForTokens(tokens: number, tokensPerCredit: number): number {
  const perCredit = tokensPerCredit > 0 ? tokensPerCredit : DEFAULT_TOKENS_PER_CREDIT;
  return Math.ceil(Math.max(0, tokens) / perCredit);
}

/** Coût d'un export, en crédits. */
export function exportCreditCost(tokensPerCredit = DEFAULT_TOKENS_PER_CREDIT): number {
  return creditsForTokens(EXPORT_TOKEN_COST, tokensPerCredit);
}

/**
 * Coût d'une correction : variable, car il dépend de la longueur du texte à
 * relire. Base fixe + une tranche de tokens par 1 000 mots entamés.
 */
export function correctionCreditCost(
  wordCount: number,
  tokensPerCredit = DEFAULT_TOKENS_PER_CREDIT,
): number {
  const perThousand = Math.ceil(Math.max(0, wordCount) / 1000);
  return creditsForTokens(
    GENERATION_TOKEN_COST.correction + perThousand * CORRECTION_TOKENS_PER_1000_WORDS,
    tokensPerCredit,
  );
}

/** Coût d'une génération, tous types confondus. */
export function generationCreditCost(
  type: DocumentType,
  wordCount = 0,
  tokensPerCredit = DEFAULT_TOKENS_PER_CREDIT,
): number {
  return type === "correction"
    ? correctionCreditCost(wordCount, tokensPerCredit)
    : creditsForTokens(GENERATION_TOKEN_COST[type], tokensPerCredit);
}

/**
 * Nombre de mots total des sources d'un projet — formule unique, partagée par
 * l'estimation affichée avant génération et le décompte final des crédits.
 */
export function sourceWordCount(files: { extractedText?: string | null }[]): number {
  return files.reduce(
    (n, f) => n + (f.extractedText ?? "").split(/\s+/).filter(Boolean).length,
    0,
  );
}