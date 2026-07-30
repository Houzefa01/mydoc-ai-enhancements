import type { DocumentType } from "./types";

/** Default outline proposed for each document type. */
export const outlineByType: Record<DocumentType, string[]> = {
  rapport: [
    "Résumé exécutif",
    "Contexte et objectifs",
    "Méthodologie",
    "Résultats",
    "Analyse",
    "Recommandations",
    "Conclusion",
  ],
  resume: ["Idée principale", "Points clés", "Détails utiles", "Conclusion"],
  memoire: [
    "Introduction",
    "Problématique",
    "Revue de littérature",
    "Méthodologie",
    "Résultats",
    "Discussion",
    "Conclusion",
    "Bibliographie",
  ],
  presentation: [
    "Ouverture",
    "Contexte",
    "Points à aborder",
    "Démonstration",
    "Conclusion et questions",
  ],
  // Correction : le document corrigé conserve la structure du document source.
  // Ce plan par défaut n'est qu'un squelette tant que la correction IA n'a pas
  // renvoyé les sections réelles du fichier fourni.
  correction: ["Document corrigé", "Points corrigés", "Remarques de style"],
  cv: [
    "Informations personnelles",
    "Profil",
    "Expériences professionnelles",
    "Formation",
    "Compétences",
    "Langues",
    "Certifications",
  ],
  lettre_motivation: [
    "En-tête et destinataire",
    "Accroche",
    "Votre parcours",
    "Pourquoi cette structure",
    "Conclusion et formule de politesse",
  ],
  lettre_demande: [
    "En-tête et destinataire",
    "Objet de la demande",
    "Exposé des motifs",
    "Informations utiles",
    "Formule de politesse",
  ],
};