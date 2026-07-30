import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { GitCompare, History, Loader2, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { AppShell } from "@/components/app/AppShell";
import type { DocumentVersion } from "@/backend/types";
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

export const Route = createFileRoute("/projects/$id/history")({
  head: () => ({
    meta: [
      { title: "Historique des versions — myDoc IA" },
      {
        name: "description",
        content:
          "Comparez les versions successives de votre document et restaurez celle de votre choix.",
      },
      { property: "og:title", content: "Historique des versions — myDoc IA" },
      {
        property: "og:description",
        content: "Versions, comparaison et restauration de votre document.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const { id } = Route.useParams();
  const { projects, documents, listVersions, saveVersion, restoreVersion } = useStore();
  const project = projects.find((p) => p.id === id);
  const doc = documents[id];

  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [left, setLeft] = useState<number | null>(null);
  const [right, setRight] = useState<number | null>(null);
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [pendingRestore, setPendingRestore] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const list = await listVersions(id);
    setVersions(list);
    setRight(list[0]?.version ?? null);
    setLeft(list[1]?.version ?? list[0]?.version ?? null);
    setLoading(false);
  }, [id, listVersions]);

  useEffect(() => {
    if (doc) void refresh();
    else setLoading(false);
  }, [doc, refresh]);

  if (!project) {
    return (
      <AppShell>
        <p className="text-sm text-ink-soft">Projet introuvable.</p>
      </AppShell>
    );
  }

  const leftV = versions.find((v) => v.version === left);
  const rightV = versions.find((v) => v.version === right);
  const delta = leftV && rightV ? rightV.wordCount - leftV.wordCount : null;

  const onSave = async () => {
    setBusy(true);
    const error = await saveVersion(id, label.trim());
    setBusy(false);
    if (error) {
      toast.error(error);
      return;
    }
    setLabel("");
    toast.success("Version enregistrée.");
    await refresh();
  };

  return (
    <AppShell>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-6">
        <div>
          <p className="font-numeric text-xs uppercase tracking-[0.2em] text-ink-mute">
            Historique · {project.title}
          </p>
          <h1 className="mt-2 font-editorial text-3xl text-ink">Versions du document</h1>
        </div>
        <Link
          to="/projects/$id/editor"
          params={{ id }}
          className="rounded-md border border-rule bg-card px-3 py-2 text-sm text-ink-soft hover:text-ink"
        >
          Retour à l'éditeur
        </Link>
      </div>

      <div className="mb-8 flex flex-wrap items-center gap-3 rounded-md border border-rule bg-card p-4">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Nom de la version (ex. « Relecture Camille »)"
          className="min-w-56 flex-1 rounded-md border border-rule bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-primary"
        />
        <button
          onClick={onSave}
          disabled={!doc || busy}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Enregistrer l'état actuel
        </button>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <div>
          {loading ? (
            <p className="text-sm text-ink-mute">Chargement des versions…</p>
          ) : versions.length === 0 ? (
            <div className="rounded-md border border-dashed border-rule p-6 text-center">
              <History className="mx-auto h-5 w-5 text-ink-mute" />
              <p className="mt-3 text-sm text-ink-soft">
                Aucune version enregistrée. Sauvegardez l'état actuel pour créer un point de repère.
              </p>
            </div>
          ) : (
            <ol className="space-y-2">
              {versions.map((v) => {
                const isLeft = v.version === left;
                const isRight = v.version === right;
                return (
                  <li
                    key={v.version}
                    className={cn(
                      "rounded-md border p-4",
                      isLeft || isRight ? "border-primary/40 bg-accent" : "border-rule bg-card",
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-numeric text-xs text-ink-mute">
                        V{String(v.version).padStart(2, "0")} —{" "}
                        {new Date(v.createdAt).toLocaleString("fr-FR")}
                      </span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setLeft(v.version)}
                          className={cn(
                            "rounded border px-2 py-0.5 text-[11px] uppercase tracking-wider",
                            isLeft
                              ? "border-primary text-primary"
                              : "border-rule text-ink-mute hover:text-ink",
                          )}
                        >
                          Avant
                        </button>
                        <button
                          onClick={() => setRight(v.version)}
                          className={cn(
                            "rounded border px-2 py-0.5 text-[11px] uppercase tracking-wider",
                            isRight
                              ? "border-primary text-primary"
                              : "border-rule text-ink-mute hover:text-ink",
                          )}
                        >
                          Après
                        </button>
                      </div>
                    </div>
                    <p className="mt-2 font-editorial text-base text-ink">{v.label}</p>
                    <div className="mt-1 flex items-center justify-between gap-3">
                      <p className="font-numeric text-xs text-ink-mute">
                        {v.sectionCount} sections · {v.wordCount.toLocaleString("fr-FR")} mots
                      </p>
                      <button
                        onClick={() => setPendingRestore(v.version)}
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <RotateCcw className="h-3 w-3" /> Restaurer
                      </button>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        <div className="surface-page rounded-md p-6">
          <div className="mb-4 flex items-center gap-2 border-b border-rule pb-3">
            <GitCompare className="h-4 w-4 text-primary" />
            <h2 className="font-editorial text-lg text-ink">
              {leftV && rightV
                ? `Comparaison V${leftV.version} → V${rightV.version}`
                : "Comparaison"}
            </h2>
          </div>

          {!leftV || !rightV ? (
            <p className="text-sm text-ink-soft">
              Enregistrez au moins deux versions pour les comparer.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-6 text-sm">
                <div>
                  <div className="mb-2 font-numeric text-xs uppercase tracking-wider text-ink-mute">
                    Version {leftV.version}
                  </div>
                  <p className="text-ink-soft">{leftV.label}</p>
                  <p className="mt-2 font-numeric text-xs text-ink-mute">
                    {leftV.sectionCount} sections · {leftV.wordCount.toLocaleString("fr-FR")} mots
                  </p>
                </div>
                <div>
                  <div className="mb-2 font-numeric text-xs uppercase tracking-wider text-ink-mute">
                    Version {rightV.version}
                  </div>
                  <p className="text-ink-soft">{rightV.label}</p>
                  <p className="mt-2 font-numeric text-xs text-ink-mute">
                    {rightV.sectionCount} sections · {rightV.wordCount.toLocaleString("fr-FR")} mots
                    {delta !== null && delta !== 0 && (
                      <>
                        {" · "}
                        <span className={delta > 0 ? "text-primary" : "text-destructive"}>
                          {delta > 0 ? "+" : ""}
                          {delta.toLocaleString("fr-FR")}
                        </span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-md border border-rule bg-paper-deep/40 p-4 text-xs text-ink-soft">
                {rightV.sectionCount - leftV.sectionCount === 0
                  ? "Même nombre de sections entre les deux versions."
                  : `${Math.abs(rightV.sectionCount - leftV.sectionCount)} section(s) ${
                      rightV.sectionCount > leftV.sectionCount ? "ajoutée(s)" : "supprimée(s)"
                    } entre les deux versions.`}
              </div>
            </>
          )}
        </div>
      </div>

      <AlertDialog
        open={pendingRestore !== null}
        onOpenChange={(open) => !open && setPendingRestore(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restaurer la version {pendingRestore} ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le contenu actuel du document sera remplacé par celui de cette version. Pensez à
              enregistrer l'état actuel avant de continuer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (pendingRestore === null) return;
                const error = await restoreVersion(id, pendingRestore);
                setPendingRestore(null);
                if (error) toast.error(error);
                else toast.success("Version restaurée.");
              }}
            >
              Restaurer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
