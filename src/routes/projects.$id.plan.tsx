import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { AppShell } from "@/components/app/AppShell";
import { LivingOutline } from "@/components/app/LivingOutline";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Section } from "@/backend/types";
import { typeLabels } from "@/lib/labels";

export const Route = createFileRoute("/projects/$id/plan")({
  head: () => ({
    meta: [
      { title: "Validation du plan — myDoc IA" },
      {
        name: "description",
        content:
          "Réordonnez, renommez et complétez la structure proposée avant de lancer la rédaction.",
      },
      { property: "og:title", content: "Validation du plan — myDoc IA" },
      {
        property: "og:description",
        content: "Ajustez le sommaire proposé par l'IA puis lancez la rédaction.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PlanPage,
});

function PlanPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { projects, documents, updateSections, updateSectionTitle, updateSectionDescription } =
    useStore();

  const project = projects.find((p) => p.id === id);
  const doc = documents[id];
  const [activeId, setActiveId] = useState<string | null>(doc?.sections[0]?.id ?? null);

  if (!project || !doc) {
    return (
      <AppShell>
        <div className="mx-auto max-w-lg text-center">
          <h1 className="font-editorial text-2xl text-ink">Projet introuvable</h1>
          <p className="mt-2 text-sm text-ink-soft">
            Ce projet n'existe pas ou son plan n'a pas encore été généré.
          </p>
          <Link
            to="/dashboard"
            className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
          >
            Revenir aux projets
          </Link>
        </div>
      </AppShell>
    );
  }

  const setSections = (next: Section[]) => updateSections(id, next);

  const rename = (sid: string, title: string) => {
    updateSectionTitle(id, sid, title);
  };
  const remove = (sid: string) => {
    setSections(doc.sections.filter((s) => s.id !== sid));
  };
  const add = () => {
    setSections([
      ...doc.sections,
      { id: crypto.randomUUID(), title: "Nouvelle section", blocks: [] },
    ]);
  };

  const validate = () => {
    // BACKEND: POST /api/documents/:id/start-writing
    toast.success("Rédaction lancée.");
    navigate({ to: "/projects/$id/editor", params: { id } });
  };

  return (
    <AppShell>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-6">
        <div>
          <p className="font-numeric text-xs uppercase tracking-[0.2em] text-ink-mute">
            Étape 02 · Plan proposé — {typeLabels[project.type]}
          </p>
          <h1 className="mt-2 font-editorial text-3xl text-ink">{project.title}</h1>
        </div>
        <button
          onClick={validate}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          Valider et rédiger <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-x-12 gap-y-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <LivingOutline
          sections={doc.sections}
          activeId={activeId}
          onSelect={setActiveId}
          onReorder={setSections}
          onRename={rename}
          onRemove={remove}
          onAdd={add}
        />

        <section>
          <p className="mb-6 max-w-2xl text-sm text-ink-soft">
            L'IA a proposé cette structure à partir de votre description et de vos sources.
            Réordonnez-la par glisser-déposer, renommez une section en double-cliquant, ajoutez ou
            supprimez ce qui manque — vous validez quand vous êtes prêt.
          </p>

          <ol className="space-y-3">
            {doc.sections.map((s, i) => (
              <li key={s.id} className="surface-page flex items-start gap-4 rounded-md p-5">
                <span className="font-numeric text-sm text-ink-mute tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex-1 space-y-2">
                  <Input
                    value={s.title}
                    onChange={(e) => updateSectionTitle(id, s.id, e.target.value)}
                    className="border-0 border-b border-transparent bg-transparent px-0 font-editorial text-xl text-ink shadow-none focus-visible:border-primary focus-visible:ring-0"
                    placeholder="Titre de la section"
                  />
                  <Textarea
                    value={s.description ?? ""}
                    onChange={(e) => updateSectionDescription(id, s.id, e.target.value)}
                    rows={2}
                    placeholder="Décrivez ce que cette section doit couvrir (points-clés, sources, angle)…"
                    className="text-sm"
                  />
                  <p className="text-xs text-ink-mute">
                    Rédaction estimée — 2 à 4 crédits selon la longueur.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => remove(s.id)}
                  className="mt-1 rounded p-1 text-ink-mute hover:text-destructive"
                  aria-label={`Supprimer ${s.title}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
            <li>
              <button
                onClick={add}
                className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-rule bg-transparent p-4 text-sm text-ink-mute transition hover:border-ink-soft hover:text-ink"
              >
                <Plus className="h-4 w-4" /> Ajouter une section
              </button>
            </li>
          </ol>
        </section>
      </div>
    </AppShell>
  );
}
