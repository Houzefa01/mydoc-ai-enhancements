import type { ExportFormat } from "./types";

export type { ExportFormat };

export interface AdminUserRow {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  balance: number;
  projectCount: number;
  suspended: boolean;
  isAdmin: boolean;
}

export interface AdminExportJob {
  id: string;
  format: ExportFormat;
  documentTitle: string;
  documentType: string;
  ownerEmail: string;
  errorMessage: string;
  createdAt: string;
}

export interface AdminStats {
  totalUsers: number;
  newUsers30d: number;
  projects30d: number;
  exportsByFormat30d: Record<string, number>;
  failedExports30d: number;
}