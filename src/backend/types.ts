// Mock data & types for myDoc IA — mirrors the future backend contract so
// the API can be plugged in without reshaping components.

export type DocumentType =
  | "rapport"
  | "resume"
  | "memoire"
  | "presentation"
  | "correction"
  | "cv"
  | "lettre_motivation"
  | "lettre_demande";

export type ProjectStatus = "brouillon" | "plan_pret" | "redaction" | "pret" | "archive";

export type ExportFormat = "pdf" | "docx" | "pptx" | "latex" | "beamer";

export type ExportStatus = "en_attente" | "en_cours" | "pret" | "echec";

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  birthDate?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  bio?: string;
  /** Compte suspendu par un administrateur : lecture seule côté application. */
  suspended?: boolean;
}

export interface Project {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  type: DocumentType;
  status: ProjectStatus;
  brief?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export type SourceFileStatus = "en_cours" | "pret" | "echec";

export interface SourceFile {
  id: string;
  projectId: string;
  fileName: string;
  sizeBytes: number;
  type: "pdf" | "docx" | "txt" | "image";
  status: SourceFileStatus;
  extractedText: string;
  description?: string;
}

export interface SectionBlock {
  kind: "paragraph" | "list" | "image" | "table";
  // paragraph: text; list: items; image: url + caption; table: rows
  text?: string;
  items?: string[];
  url?: string;
  caption?: string;
  rows?: string[][];
}

export interface Section {
  id: string;
  title: string;
  description?: string;
  blocks: SectionBlock[];
  generating?: boolean;
}

export interface DocumentContent {
  id: string;
  projectId: string;
  version: number;
  sections: Section[];
  updatedAt: string;
}

export interface DocumentVersion {
  version: number;
  createdAt: string;
  label: string;
  sectionCount: number;
  wordCount: number;
}

export interface ExportJob {
  id: string;
  documentId: string;
  format: ExportFormat;
  status: ExportStatus;
  fileUrl?: string;
  errorMessage?: string;
  createdAt: string;
}

export interface CreditTransaction {
  id: string;
  createdAt: string;
  label: string;
  amount: number; // negative = spent, positive = purchased
}

export interface CreditBalance {
  balance: number;
  transactions: CreditTransaction[];
}

