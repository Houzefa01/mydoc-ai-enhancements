import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Download, History, RotateCw, Sparkles } from "lucide-react";
import { useStore } from "@/lib/store";
import { AppShell } from "@/components/app/AppShell";
import { LivingOutline } from "@/components/app/LivingOutline";
import { AddBlockBar, BlockEditor, emptyBlock } from "@/components/app/BlockEditor";
import type { Section } from "@/backend/types";
import { typeLabels } from "@/lib/labels";

export const Route = createFileRoute("/projects/$id/editor")({
  head: () => ({
    meta: [
      { title: "Éditeur — myDoc IA" },
      {
        name: "description",
        content:
          "Rédigez, régénérez, réordonnez — l'éditeur myDoc IA garde le plan de votre document toujours à portée.",
      },
      { property: "og:title", content: "Éditeur — myDoc IA" },
      {
        property: "og:description",
        content: "Un éditeur d'écriture assistée avec sommaire vivant.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: EditorPage,
});

function EditorPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const {
    projects,
    documents,
    updateSections,
    updateSectionTitle,
    updateSectionBlocks,
    regenerateSection,
  } = useStore();

  const project = projects.find((p) => p.id === id);
  const doc = documents[id];
  const [activeId, setActiveId] = useState<string | null>(doc?.sections[0]?.id ?? null);

  if (!project || !doc) {
    return (
      <AppShell>
        <div className="mx-auto max-w-lg text-center">
          <h1 className="font-editorial text-2xl text-ink">Document introuvable</h1>
          <p className="mt-2 text-sm text-ink-soft">Générez d'abord un plan pour ce projet.</p>
          <Link
            to="/projects/$id/plan"
            params={{ id }}
            className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
          >
            Aller au plan
          </Link>
        </div>
      </AppShell>
    );
  }

  const setSections = (next: Section[]) => updateSections(id, next);

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-numeric text-xs uppercase tracking-[0.2em] text-ink-mute">
            {typeLabels[project.type]} · Version {String(doc.version).padStart(2, "0")}
          </p>
          <h1 className="mt-2 font-editorial text-3xl text-ink">{project.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/projects/$id/history"
            params={{ id }}
            className="inline-flex items-center gap-2 rounded-md border border-rule bg-card px-3 py-2 text-sm text-ink-soft hover:text-ink"
          >
            <History className="h-4 w-4" /> Historique
          </Link>
          <button
            onClick={() => navigate({ to: "/projects/$id/export", params: { id } })}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            <Download className="h-4 w-4" /> Exporter
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-x-10 gap-y-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <LivingOutline
          sections={doc.sections}
          activeId={activeId}
          onSelect={(sid) => {
            setActiveId(sid);
            document.getElementById(`section-${sid}`)?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }}
          onReorder={setSections}
          onRename={(sid, title) => updateSectionTitle(id, sid, title)}
          onRemove={(sid) => setSections(doc.sections.filter((s) => s.id !== sid))}
          onAdd={() =>
            setSections([
              ...doc.sections,
              { id: crypto.randomUUID(), title: "Nouvelle section", blocks: [] },
            ])
          }
        />

        <div className="mx-auto w-full max-w-3xl">
          <article className="surface-page rounded-md px-10 py-12">
            <header className="mb-10 border-b border-rule pb-6">
              <p className="font-numeric text-[11px] uppercase tracking-[0.24em] text-ink-mute">
                {typeLabels[project.type]}
              </p>
              <h2 className="mt-2 font-editorial text-4xl leading-tight text-ink">
                {project.title}
              </h2>
              <p className="mt-3 text-sm text-ink-soft">{project.description}</p>
            </header>

            <div className="space-y-12">
              {doc.sections.map((s, i) => (
                <section id={`section-${s.id}`} key={s.id} className="scroll-mt-28">
                  <div className="mb-4 flex items-center justify-between gap-4 border-b border-rule pb-2">
                    <div className="flex items-baseline gap-3">
                      <span className="font-numeric text-xs text-ink-mute tabular-nums">
                        §{String(i + 1).padStart(2, "0")}
                      </span>
                      <input
                        value={s.title}
                        onChange={(e) => updateSectionTitle(id, s.id, e.target.value)}
                        className="w-full border-none bg-transparent font-editorial text-2xl text-ink outline-none focus:ring-0"
                      />
                    </div>
                    <button
                      onClick={() => regenerateSection(id, s.id)}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-rule bg-paper-deep/60 px-2.5 py-1 text-xs text-ink-soft hover:text-ink"
                    >
                      <RotateCw className={"h-3.5 w-3.5 " + (s.generating ? "animate-spin" : "")} />
                      {s.generating ? "Génération…" : "Régénérer"}
                    </button>
                  </div>

                  {s.blocks.length === 0 && !s.generating ? (
                    <div className="space-y-3">
                      <button
                        onClick={() => regenerateSection(id, s.id)}
                        className="flex w-full items-center gap-2 rounded-md border border-dashed border-rule bg-transparent p-4 text-sm text-ink-mute transition hover:border-ink-soft hover:text-ink"
                      >
                        <Sparkles className="h-4 w-4" />
                        Générer le contenu de cette section
                      </button>
                      <AddBlockBar
                        onAdd={(kind) => updateSectionBlocks(id, s.id, [emptyBlock(kind)])}
                      />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <BlockEditor
                        blocks={s.blocks}
                        onChange={(blocks) => updateSectionBlocks(id, s.id, blocks)}
                      />
                      {s.generating && (
                        <div className="animate-pulse text-sm text-ink-mute">
                          Rédaction en cours…
                        </div>
                      )}
                    </div>
                  )}
                </section>
              ))}
            </div>
          </article>
        </div>
      </div>
    </AppShell>
  );
}
