import type { DocumentType, ExportFormat, ExportStatus, ProjectStatus } from "@/backend/types";

export const typeLabels: Record<DocumentType, string> = {
  rapport: "Rapport",
  resume: "Résumé",
  memoire: "Mémoire",
  presentation: "Présentation",
  correction: "Correction",
  cv: "CV",
  lettre_motivation: "Lettre de motivation",
  lettre_demande: "Lettre de demande",
};

export const statusLabels: Record<ProjectStatus, string> = {
  brouillon: "Brouillon",
  plan_pret: "Plan validé",
  redaction: "Rédaction",
  pret: "Prêt",
  archive: "Archivé",
};

export const exportFormatLabels: Record<ExportFormat, string> = {
  pdf: "PDF",
  docx: "DOCX",
  pptx: "PPTX",
  latex: "LaTeX",
  beamer: "Beamer",
};

export const exportStatusLabels: Record<ExportStatus, string> = {
  en_attente: "En attente",
  en_cours: "Génération en cours",
  pret: "Prêt",
  echec: "Échec",
};