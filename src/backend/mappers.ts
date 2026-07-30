import type {
  CreditTransaction,
  DocumentContent,
  DocumentType,
  ExportJob,
  Project,
  Section,
  SourceFile,
  User,
} from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */
export type Row = Record<string, any>;

export function mapProject(row: Row): Project {
  return {
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    description: row.description ?? "",
    type: row.type as DocumentType,
    status: row.status,
    brief: (row.brief ?? {}) as Record<string, string>,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapSource(row: Row): SourceFile {
  return {
    id: row.id,
    projectId: row.project_id,
    fileName: row.file_name,
    sizeBytes: Number(row.size_bytes),
    type: row.type,
    status: row.status,
    extractedText: row.extracted_text ?? "",
    description: row.description ?? "",
  };
}

export function mapDocument(row: Row): DocumentContent {
  return {
    id: row.id,
    projectId: row.project_id,
    version: row.version,
    sections: (row.sections ?? []) as Section[],
    updatedAt: row.updated_at,
  };
}

export function mapExport(row: Row): ExportJob {
  return {
    id: row.id,
    documentId: row.document_id,
    format: row.format,
    status: row.status,
    fileUrl: row.file_url ?? undefined,
    errorMessage: row.error_message ?? undefined,
    createdAt: row.created_at,
  };
}

export function mapTransaction(row: Row): CreditTransaction {
  return {
    id: row.id,
    createdAt: row.created_at,
    label: row.label,
    amount: row.amount,
  };
}

export function mapProfile(row: Row, avatarUrl?: string): User {
  return {
    id: row.id,
    email: row.email ?? "",
    name: row.name ?? "",
    avatarUrl,
    birthDate: row.birth_date ?? undefined,
    phone: row.phone ?? undefined,
    address: row.address ?? undefined,
    city: row.city ?? undefined,
    postalCode: row.postal_code ?? undefined,
    country: row.country ?? undefined,
    bio: row.bio ?? undefined,
    suspended: row.suspended ?? false,
  };
}

export function countWords(sections: Section[]): number {
  let n = 0;
  for (const s of sections) {
    n += s.title.split(/\s+/).filter(Boolean).length;
    for (const b of s.blocks) {
      if (b.text) n += b.text.split(/\s+/).filter(Boolean).length;
      for (const item of b.items ?? []) n += item.split(/\s+/).filter(Boolean).length;
      for (const row of b.rows ?? [])
        for (const cell of row) n += cell.split(/\s+/).filter(Boolean).length;
    }
  }
  return n;
}