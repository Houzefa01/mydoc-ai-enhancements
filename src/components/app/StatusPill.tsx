import { cn } from "@/lib/utils";
import type { ProjectStatus } from "@/backend/types";
import { statusLabels } from "@/lib/labels";

const tone: Record<ProjectStatus, string> = {
  brouillon: "text-ink-mute border-rule bg-paper-deep/60",
  plan_pret: "text-primary border-primary/30 bg-accent",
  redaction: "text-brass border-brass/40 bg-brass-soft/60",
  pret: "text-primary border-primary/40 bg-primary/10",
  archive: "text-ink-mute border-rule bg-paper-deep/60",
};

export function StatusPill({ status }: { status: ProjectStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] uppercase tracking-wider",
        tone[status],
      )}
    >
      {statusLabels[status]}
    </span>
  );
}
