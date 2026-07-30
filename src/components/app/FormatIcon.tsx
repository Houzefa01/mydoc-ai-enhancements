import { FileCode2, FileSpreadsheet, FileText, FileType, Presentation } from "lucide-react";
import type { ExportFormat } from "@/backend/types";

export function FormatIcon({ format, className }: { format: ExportFormat; className?: string }) {
  switch (format) {
    case "pdf":
      return <FileType className={className} aria-hidden />;
    case "docx":
      return <FileText className={className} aria-hidden />;
    case "pptx":
      return <Presentation className={className} aria-hidden />;
    case "latex":
      return <FileCode2 className={className} aria-hidden />;
    case "beamer":
      return <FileSpreadsheet className={className} aria-hidden />;
  }
}
