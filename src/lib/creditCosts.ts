import type { DocumentType } from "@/backend/types";

/**
 * Coûts en crédits — source unique de vérité.
 *
 * Aucune valeur de crédit ne doit être écrite en dur ailleurs dans le code :
 * si un tarif change, il change ici et nulle part ailleurs.
 */

/** Coût d'une génération complète, par type de document. */
export const GENERATION_CREDIT_COST: Record<DocumentType, number> = {
  rapport: 5,
  resume: 3,
  memoire: 8,
  presentation: 4,
  // Une correction retravaille un texte déjà écrit : moins coûteux qu'une
  // rédaction complète à partir d'un plan.
  correction: 2,
  cv: 3,
  lettre_motivation: 2,
  lettre_demande: 2,
};

/** Coût spécifique de la correction, exposé nommément pour le branchement backend. */
export const CORRECTION_CREDIT_COST = GENERATION_CREDIT_COST.correction;

/** Coût d'un export, quel que soit le format. */
export const EXPORT_CREDIT_COST = 1;