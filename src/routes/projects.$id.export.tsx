import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Download, Loader2, RotateCw, Trash2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { AppShell } from "@/components/app/AppShell";
import { FormatIcon } from "@/components/app/FormatIcon";
import type { ExportFormat, ExportStatus } from "@/backend/types";
import { exportFormatLabels, exportStatusLabels } from "@/lib/labels";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/projects/$id/export")({
  head: () => ({
    meta: [
      { title: "Exporter votre document — myDoc IA" },
      {
        name: "description",
        content: "Générez et téléchargez votre document en PDF, DOCX, PPTX, LaTeX ou Beamer.",
      },
      { property: "og:title", content: "Exporter votre document — myDoc IA" },
      {
        property: "og:description",
        content: "Téléchargez votre document dans le format qui vous convient.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ExportPage,
});

const formats: ExportFormat[] = ["pdf", "docx", "pptx", "latex", "beamer"];

function ExportPage() {
  const { id } = Route.useParams();
  const { projects, documents, exports, requestExport, retryExport, downloadExport, deleteExport } =
    useStore();
  const project = projects.find((p) => p.id === id);
  const doc = documents[id];
  const [selected, setSelected] = useState<Set<ExportFormat>>(new Set(["pdf"]));
  const [running, setRunning] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  if (!project || !doc) {
    return (
      <AppShell>
        <div className="mx-auto max-w-lg text-center">
          <h1 className="font-editorial text-2xl text-ink">Rien à exporter</h1>
          <p className="mt-2 text-sm text-ink-soft">Ce projet n'a pas encore de document rédigé.</p>
          <Link
            to="/dashboard"
            className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
          >
            Retour aux projets
          </Link>
        </div>
      </AppShell>
    );
  }

  const projectExports = exports.filter((e) => e.documentId === doc.id);

  const toggle = (f: ExportFormat) => {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(f)) next.delete(f);
      else next.add(f);
      return next;
    });
  };

  const launch = async () => {
    if (selected.size === 0) {
      toast.error("Sélectionnez au moins un format.");
      return;
    }
    setRunning(true);
    const chosen = [...selected];
    const errors: string[] = [];
    for (const format of chosen) {
      const error = await requestExport(id, format);
      if (error) errors.push(`${exportFormatLabels[format]} : ${error}`);
    }
    setRunning(false);
    if (errors.length === 0) {
      toast.success(
        `${chosen.length} export${chosen.length > 1 ? "s" : ""} prêt${chosen.length > 1 ? "s" : ""} au téléchargement.`,
      );
    } else {
      errors.forEach((e) => toast.error(e));
    }
  };

  return (
    <AppShell>
      <div className="mb-8 border-b border-rule pb-6">
        <p className="font-numeric text-xs uppercase tracking-[0.2em] text-ink-mute">
          Export · {project.title}
        </p>
        <h1 className="mt-2 font-editorial text-3xl text-ink">Choisissez vos formats</h1>
        <p className="mt-2 max-w-xl text-sm text-ink-soft">
          Chaque format est généré indépendamment et coûte 1 crédit. Les fichiers restent
          disponibles au téléchargement dans la liste ci-dessous.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <section>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2">
            {formats.map((f) => {
              const active = selected.has(f);
              return (
                <button
                  key={f}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggle(f)}
                  className={cn(
                    "flex flex-col items-start gap-2 rounded-md border p-4 text-left transition",
                    active
                      ? "border-primary bg-accent"
                      : "border-rule bg-card hover:border-ink-mute",
                  )}
                >
                  <FormatIcon
                    format={f}
                    className={cn("h-5 w-5", active ? "text-primary" : "text-ink-soft")}
                  />
                  <div className="font-editorial text-lg text-ink">{exportFormatLabels[f]}</div>
                  <p className="font-numeric text-[11px] uppercase tracking-wider text-ink-mute">
                    .{f}
                  </p>
                </button>
              );
            })}
          </div>

          <button
            onClick={launch}
            disabled={running}
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
          >
            {running && <Loader2 className="h-4 w-4 animate-spin" />}
            {running ? "Génération en cours…" : "Lancer la génération"}
          </button>
        </section>

        <section>
          <h2 className="font-editorial text-sm uppercase tracking-[0.18em] text-ink-mute">
            Vos exports
          </h2>

          {projectExports.length === 0 ? (
            <p className="mt-4 text-sm text-ink-soft">Aucun export pour l'instant.</p>
          ) : (
            <ul className="mt-4 divide-y divide-rule rounded-md border border-rule bg-card">
              {projectExports.map((e) => (
                <li key={e.id} className="flex items-center gap-4 px-4 py-3">
                  <FormatIcon format={e.format} className="h-5 w-5 text-primary" />
                  <div className="min-w-0 flex-1">
                    <div className="font-editorial text-base text-ink">
                      {exportFormatLabels[e.format]}
                    </div>
                    <div className="font-numeric text-xs text-ink-mute">
                      {new Date(e.createdAt).toLocaleString("fr-FR")}
                    </div>
                    {e.errorMessage && (
                      <div className="mt-1 text-xs text-destructive">{e.errorMessage}</div>
                    )}
                  </div>

                  <StatusCell
                    status={e.status}
                    onDownload={async () => {
                      const error = await downloadExport(e.id);
                      if (error) toast.error(error);
                    }}
                    onRetry={async () => {
                      const error = await retryExport(e.id);
                      if (error) toast.error(error);
                      else toast.success("Export régénéré.");
                    }}
                  />

                  <button
                    onClick={() => setPendingDelete(e.id)}
                    aria-label="Supprimer cet export"
                    className="shrink-0 rounded-md p-1.5 text-ink-mute transition hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet export ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le fichier généré sera définitivement supprimé. Vous pourrez relancer une génération à
              tout moment (1 crédit).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (!pendingDelete) return;
                await deleteExport(pendingDelete);
                setPendingDelete(null);
                toast.success("Export supprimé.");
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}

function StatusCell({
  status,
  onRetry,
  onDownload,
}: {
  status: ExportStatus;
  onRetry: () => void;
  onDownload: () => void;
}) {
  if (status === "en_cours" || status === "en_attente") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-ink-soft">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        {exportStatusLabels[status]}
      </span>
    );
  }
  if (status === "pret") {
    return (
      <button
        onClick={onDownload}
        className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-accent px-3 py-1.5 text-xs font-medium text-primary transition hover:bg-primary hover:text-primary-foreground"
      >
        <Download className="h-3.5 w-3.5" /> Télécharger
      </button>
    );
  }
  return (
    <div className="flex flex-col items-end gap-1">
      <span className="inline-flex items-center gap-1 text-xs text-destructive">
        <TriangleAlert className="h-3.5 w-3.5" /> {exportStatusLabels.echec}
      </span>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
      >
        <RotateCw className="h-3 w-3" /> Reprendre
      </button>
    </div>
  );
}
