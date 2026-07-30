import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowUpRight, FilePlus2, Search, Sparkles, Trash2, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { AppShell } from "@/components/app/AppShell";
import { StatusPill } from "@/components/app/StatusPill";
import type { DocumentType, ProjectStatus } from "@/backend/types";
import { statusLabels, typeLabels } from "@/lib/labels";
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

interface DashboardSearch {
  q?: string;
  type?: string;
  status?: string;
  sort?: string;
}

const asString = (value: unknown, fallback: string) =>
  typeof value === "string" && value.length > 0 ? value : fallback;

export const Route = createFileRoute("/dashboard")({
  validateSearch: (search: Record<string, unknown>): DashboardSearch => ({
    q: asString(search.q, ""),
    type: asString(search.type, "tous"),
    status: asString(search.status, "tous"),
    sort: asString(search.sort, "recent"),
  }),
  head: () => ({
    meta: [
      { title: "Vos projets — myDoc IA" },
      {
        name: "description",
        content:
          "Retrouvez, filtrez et gérez vos rapports, résumés, mémoires et présentations en cours de rédaction.",
      },
      { property: "og:title", content: "Vos projets — myDoc IA" },
      {
        property: "og:description",
        content: "Tableau de bord de vos documents rédigés avec myDoc IA.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/dashboard" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [{ rel: "canonical", href: "/dashboard" }],
  }),
  component: Dashboard,
});

const typeOptions = ["tous", ...Object.keys(typeLabels)] as const;
const statusOptions = ["tous", ...Object.keys(statusLabels)] as const;

function Dashboard() {
  const { projects, user, deleteProject } = useStore();
  const { q = "", type = "tous", status = "tous", sort = "recent" } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const setSearch = (patch: Partial<DashboardSearch>) =>
    navigate({
      to: "/dashboard",
      search: (prev: DashboardSearch) => ({ ...prev, ...patch }),
    });

  const needle = q.trim().toLowerCase();
  const filtered = projects
    .filter((p) => {
      if (type !== "tous" && p.type !== type) return false;
      if (status !== "tous" && p.status !== status) return false;
      if (!needle) return true;
      return p.title.toLowerCase().includes(needle) || p.description.toLowerCase().includes(needle);
    })
    .sort((a, b) => {
      if (sort === "titre") return a.title.localeCompare(b.title, "fr");
      if (sort === "ancien") return +new Date(a.updatedAt) - +new Date(b.updatedAt);
      return +new Date(b.updatedAt) - +new Date(a.updatedAt);
    });

  const hasFilters = needle !== "" || type !== "tous" || status !== "tous";
  const target = projects.find((p) => p.id === pendingDelete);

  return (
    <AppShell>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-6">
        <div>
          <p className="font-numeric text-xs uppercase tracking-[0.2em] text-ink-mute">
            Atelier de {user?.name?.split(" ")[0] ?? "vous"}
          </p>
          <h1 className="mt-2 font-editorial text-4xl text-ink">Vos projets</h1>
        </div>
        <Link
          to="/projects/new"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          <FilePlus2 className="h-4 w-4" /> Nouveau projet
        </Link>
      </div>

      {projects.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="mb-8 flex flex-wrap items-center gap-3">
            <div className="relative min-w-56 flex-1">
              <Search
                aria-hidden
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute"
              />
              <input
                value={q}
                onChange={(e) => setSearch({ q: e.target.value })}
                placeholder="Rechercher un titre ou une description…"
                aria-label="Rechercher un projet"
                className="w-full rounded-md border border-rule bg-card py-2 pl-9 pr-3 text-sm text-ink outline-none transition placeholder:text-ink-mute focus:border-primary"
              />
            </div>

            <FilterSelect
              label="Type"
              value={type}
              options={typeOptions.map((v) => ({
                value: v,
                label: v === "tous" ? "Tous les types" : typeLabels[v as DocumentType],
              }))}
              onChange={(v) => setSearch({ type: v })}
            />
            <FilterSelect
              label="Statut"
              value={status}
              options={statusOptions.map((v) => ({
                value: v,
                label: v === "tous" ? "Tous les statuts" : statusLabels[v as ProjectStatus],
              }))}
              onChange={(v) => setSearch({ status: v })}
            />
            <FilterSelect
              label="Tri"
              value={sort}
              options={[
                { value: "recent", label: "Plus récents" },
                { value: "ancien", label: "Plus anciens" },
                { value: "titre", label: "Titre A→Z" },
              ]}
              onChange={(v) => setSearch({ sort: v })}
            />

            {hasFilters && (
              <button
                onClick={() => setSearch({ q: "", type: "tous", status: "tous" })}
                className="inline-flex items-center gap-1.5 text-xs text-ink-mute hover:text-ink"
              >
                <X className="h-3.5 w-3.5" /> Réinitialiser
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-x-10 gap-y-8 md:grid-cols-12">
            <div className="md:col-span-3">
              <h2 className="font-editorial text-sm uppercase tracking-[0.18em] text-ink-mute">
                Sommaire
              </h2>
              <p className="mt-3 font-numeric text-xs text-ink-mute">
                {String(filtered.length).padStart(2, "0")} projet
                {filtered.length > 1 ? "s" : ""} affiché
                {filtered.length > 1 ? "s" : ""} sur {projects.length}
              </p>
            </div>

            {filtered.length === 0 ? (
              <p className="md:col-span-9 text-sm text-ink-soft">
                Aucun projet ne correspond à cette recherche.
              </p>
            ) : (
              <ul className="md:col-span-9">
                {filtered.map((p) => (
                  <li key={p.id} className="group flex items-center gap-4 border-b border-rule">
                    <Link
                      to="/projects/$id/editor"
                      params={{ id: p.id }}
                      className="grid min-w-0 flex-1 grid-cols-1 gap-2 py-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-8"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-3">
                          <span className="font-numeric text-[11px] uppercase tracking-wider text-ink-mute">
                            {typeLabels[p.type]}
                          </span>
                          <StatusPill status={p.status} />
                        </div>
                        <h3 className="mt-2 truncate font-editorial text-2xl text-ink transition group-hover:text-primary">
                          {p.title}
                        </h3>
                        <p className="mt-1 line-clamp-2 max-w-2xl text-sm text-ink-soft">
                          {p.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-ink-mute sm:flex-col sm:items-end sm:gap-1">
                        <span className="font-numeric text-xs tabular-nums">
                          {new Date(p.updatedAt).toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </span>
                        <ArrowUpRight className="h-4 w-4 shrink-0 transition group-hover:text-primary" />
                      </div>
                    </Link>

                    <button
                      onClick={() => setPendingDelete(p.id)}
                      aria-label={`Supprimer ${p.title}`}
                      className="shrink-0 rounded-md border border-transparent p-2 text-ink-mute opacity-0 transition hover:border-rule hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce projet ?</AlertDialogTitle>
            <AlertDialogDescription>
              «&nbsp;{target?.title}&nbsp;» sera définitivement supprimé, avec son document, ses
              sources et ses exports. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (!pendingDelete) return;
                await deleteProject(pendingDelete);
                setPendingDelete(null);
                toast.success("Projet supprimé.");
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

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="inline-flex items-center gap-2 text-xs text-ink-mute">
      <span className="sr-only sm:not-sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className={cn(
          "rounded-md border border-rule bg-card px-2.5 py-2 text-sm text-ink outline-none transition focus:border-primary",
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function EmptyState() {
  return (
    <div className="mx-auto mt-16 max-w-lg text-center">
      <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full border border-rule bg-card">
        <Sparkles className="h-6 w-6 text-primary" />
      </div>
      <h2 className="mt-6 font-editorial text-3xl text-ink">Aucun projet pour l'instant.</h2>
      <p className="mt-2 text-sm text-ink-soft">
        Crée le premier document — myDoc IA te propose une structure, tu la valides, la rédaction se
        lance.
      </p>
      <Link
        to="/projects/new"
        className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
      >
        <FilePlus2 className="h-4 w-4" /> Créer mon premier document
      </Link>
    </div>
  );
}
