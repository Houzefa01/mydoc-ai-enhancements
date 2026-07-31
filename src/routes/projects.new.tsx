import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  BookOpen,
  FileStack,
  GraduationCap,
  Presentation,
  IdCard,
  Mail,
  FileSignature,
  SpellCheck,
  Upload,
  X,
  CheckCircle2,
  Loader2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { AppShell } from "@/components/app/AppShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { DocumentType, SourceFile } from "@/backend/types";
import { briefFields } from "@/lib/documentBriefs";
import { generationCreditCost, sourceWordCount } from "@/lib/creditCosts";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/projects/new")({
  head: () => ({
    meta: [
      { title: "Nouveau projet — myDoc IA" },
      {
        name: "description",
        content: "Décrivez votre document, chargez vos sources, myDoc IA propose une structure.",
      },
      { property: "og:title", content: "Nouveau projet — myDoc IA" },
      {
        property: "og:description",
        content: "Créez un rapport, résumé, mémoire, présentation, CV ou lettre.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: NewProjectPage,
});

const types: {
  value: DocumentType;
  label: string;
  desc: string;
  icon: typeof BookOpen;
}[] = [
  {
    value: "rapport",
    label: "Rapport",
    desc: "Analyse structurée, tables, annexes.",
    icon: FileStack,
  },
  {
    value: "resume",
    label: "Résumé",
    desc: "Note de synthèse dense et directe.",
    icon: BookOpen,
  },
  {
    value: "memoire",
    label: "Mémoire",
    desc: "Travail long, bibliographie, chapitres.",
    icon: GraduationCap,
  },
  {
    value: "presentation",
    label: "Présentation",
    desc: "Slides claires, orientées prise de parole.",
    icon: Presentation,
  },
  {
    value: "correction",
    label: "Correction",
    desc: "Corrige un document existant : le fichier est obligatoire.",
    icon: SpellCheck,
  },
  {
    value: "cv",
    label: "CV",
    desc: "Parcours, compétences, mise en page sobre.",
    icon: IdCard,
  },
  {
    value: "lettre_motivation",
    label: "Lettre de motivation",
    desc: "Argumentaire ciblé sur une offre.",
    icon: Mail,
  },
  {
    value: "lettre_demande",
    label: "Lettre de demande",
    desc: "Courrier formel adressé à un destinataire.",
    icon: FileSignature,
  },
];

function NewProjectPage() {
  const {
    createProject,
    addSourceFile,
    sourceFiles,
    generateOutline,
    updateSourceFileDescription,
    removeSourceFile,
    settings,
    credits,
  } = useStore();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<DocumentType>("rapport");
  const [brief, setBrief] = useState<Record<string, string>>({});
  const [projectId, setProjectId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const projectFiles = projectId ? sourceFiles.filter((f) => f.projectId === projectId) : [];
  // La correction retravaille un texte existant : sans fichier source, il n'y a
  // rien à corriger.
  const requiresSource = type === "correction";

  // Estimation affichée avant lancement : même formule que le décompte final.
  const estimatedWords = sourceWordCount(projectFiles);
  const estimatedCost = generationCreditCost(type, estimatedWords, settings.tokensPerCredit);
  const notEnoughCredits = credits.balance < estimatedCost;

  const ensureProject = async (): Promise<string | null> => {
    if (projectId) return projectId;
    if (!title.trim()) {
      toast.error("Donnez un titre à votre projet avant d'ajouter des sources.");
      return null;
    }
    const missing = briefFields[type].filter((f) => f.required && !(brief[f.key] ?? "").trim());
    if (missing.length > 0) {
      toast.error(`Champ obligatoire : ${missing[0].label}.`);
      return null;
    }
    const p = await createProject({ title, description, type, brief });
    if (!p) {
      toast.error("Création impossible. Reconnectez-vous puis réessayez.");
      return null;
    }
    setProjectId(p.id);
    return p.id;
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const id = await ensureProject();
    if (!id) return;
    for (const f of Array.from(files)) {
      const error = await addSourceFile(id, f);
      if (error) toast.error(`${f.name} : ${error}`);
    }
  };

  const submit = async () => {
    const missing = briefFields[type].filter((f) => f.required && !(brief[f.key] ?? "").trim());
    if (missing.length > 0) {
      toast.error(`Champ obligatoire : ${missing[0].label}.`);
      return;
    }
    if (requiresSource && projectFiles.length === 0) {
      toast.error("Chargez le document à corriger avant de lancer la correction.");
      return;
    }
    const id = await ensureProject();
    if (!id) return;
    const error = await generateOutline(id);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success(requiresSource ? "Correction en cours." : "Plan en cours de génération.");
    navigate({ to: "/projects/$id/plan", params: { id } });
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl">
        <p className="font-numeric text-xs uppercase tracking-[0.2em] text-ink-mute">
          Étape 01 · Cadrage
        </p>
        <h1 className="mt-2 font-editorial text-4xl text-ink">Nouveau document</h1>
        <p className="mt-2 max-w-xl text-sm text-ink-soft">
          Décrivez ce que vous cherchez à écrire et fournissez les sources : plus elles sont
          précises, plus le plan proposé sera juste.
        </p>

        <div className="mt-10 space-y-10">
          {/* Titre & description */}
          <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <Label htmlFor="title">Titre du projet</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex. Rapport annuel Fondation Marée"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="desc">Description</Label>
              <Textarea
                id="desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Public visé, ton, points-clés à traiter…"
                className="mt-1"
                rows={3}
              />
            </div>
          </section>

          {/* Type */}
          <section>
            <h2 className="font-editorial text-sm uppercase tracking-[0.18em] text-ink-mute">
              Type de document
            </h2>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {types.map((t) => {
                const active = t.value === type;
                const Icon = t.icon;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => {
                      setType(t.value);
                      setBrief({});
                    }}
                    className={cn(
                      "flex flex-col items-start gap-2 rounded-md border p-4 text-left transition",
                      active
                        ? "border-primary bg-accent"
                        : "border-rule bg-card hover:border-ink-mute",
                    )}
                  >
                    <Icon className={cn("h-5 w-5", active ? "text-primary" : "text-ink-soft")} />
                    <div className="font-editorial text-lg text-ink">{t.label}</div>
                    <p className="text-xs text-ink-soft">{t.desc}</p>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Cadrage spécifique au type */}
          <section>
            <h2 className="font-editorial text-sm uppercase tracking-[0.18em] text-ink-mute">
              Éléments à fournir
            </h2>
            <p className="mt-2 text-xs text-ink-soft">
              Tous ces champs sont optionnels, sauf ceux marqués «&nbsp;obligatoire&nbsp;».
            </p>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              {briefFields[type].map((f) => (
                <div key={f.key} className={cn(f.multiline && "md:col-span-2")}>
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor={`brief-${f.key}`}>{f.label}</Label>
                    <span className="font-numeric text-[10px] uppercase tracking-[0.14em] text-ink-mute">
                      {f.required ? "Obligatoire" : "Optionnel"}
                    </span>
                  </div>
                  {f.multiline ? (
                    <Textarea
                      id={`brief-${f.key}`}
                      value={brief[f.key] ?? ""}
                      onChange={(e) => setBrief((b) => ({ ...b, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      rows={3}
                      className="mt-1"
                    />
                  ) : (
                    <Input
                      id={`brief-${f.key}`}
                      value={brief[f.key] ?? ""}
                      onChange={(e) => setBrief((b) => ({ ...b, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      className="mt-1"
                    />
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Sources */}
          <section>
            <h2 className="font-editorial text-sm uppercase tracking-[0.18em] text-ink-mute">
              Sources
            </h2>
            {requiresSource && (
              <p className="mt-2 text-xs text-ink-soft">
                Document à corriger&nbsp;: <strong className="text-ink">obligatoire</strong>. La
                correction s'applique au texte que vous chargez ici.
              </p>
            )}
            {requiresSource && projectFiles.length > 0 && (
              <div className="mt-3 rounded-md border border-rule bg-paper-deep/40 p-4 text-sm">
                <p className="text-ink">
                  Texte extrait&nbsp;:{" "}
                  <strong className="font-numeric tabular-nums">
                    {estimatedWords.toLocaleString("fr-FR")}
                  </strong>{" "}
                  mots · Coût estimé&nbsp;:{" "}
                  <strong className="font-numeric tabular-nums">{estimatedCost}</strong> crédits
                </p>
                <p className="mt-1 text-xs text-ink-soft">
                  Estimation calculée avec la formule exacte du décompte final. Solde actuel&nbsp;:{" "}
                  <span className="font-numeric tabular-nums">{credits.balance}</span> crédits.
                </p>
                {notEnoughCredits && (
                  <p role="alert" className="mt-1 text-xs text-destructive">
                    Crédits insuffisants pour lancer la correction.
                  </p>
                )}
              </div>
            )}
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                handleFiles(e.dataTransfer.files);
              }}
              className={cn(
                "mt-3 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed p-10 text-center transition",
                dragOver
                  ? "border-primary bg-accent"
                  : "border-rule bg-paper-deep/40 hover:border-ink-mute",
              )}
            >
              <Upload className="h-6 w-6 text-ink-mute" />
              <div className="font-editorial text-lg text-ink">Déposez vos fichiers ici</div>
              <p className="text-xs text-ink-soft">
                PDF, DOCX, TXT ou images — nombre de fichiers illimité, l'extraction démarre
                automatiquement.
              </p>
              <input
                type="file"
                multiple
                className="sr-only"
                onChange={(e) => handleFiles(e.target.files)}
                accept=".pdf,.docx,.txt,image/*"
              />
            </label>

            {projectFiles.length > 0 && (
              <ul className="mt-4 divide-y divide-rule overflow-hidden rounded-md border border-rule bg-card">
                {projectFiles.map((f) => (
                  <li key={f.id} className="flex flex-col gap-2 px-4 py-3 text-sm">
                    <div className="flex items-center gap-3">
                      <span className="font-numeric text-[11px] uppercase text-ink-mute">
                        {f.type}
                      </span>
                      <span className="flex-1 truncate text-ink">{f.fileName}</span>
                      <span className="font-numeric text-xs text-ink-mute">
                        {(f.sizeBytes / 1024).toFixed(0)} ko
                      </span>
                      {f.status === "en_cours" ? (
                        <span className="inline-flex items-center gap-1 text-xs text-ink-soft">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Extraction
                        </span>
                      ) : f.status === "pret" ? (
                        <span className="inline-flex items-center gap-1 text-xs text-primary">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Prêt
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-destructive">
                          <X className="h-3.5 w-3.5" /> Échec
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeSourceFile(f.id)}
                        className="rounded p-1 text-ink-mute hover:text-destructive"
                        aria-label={`Retirer ${f.fileName}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <Textarea
                      value={f.description ?? ""}
                      onChange={(e) => updateSourceFileDescription(f.id, e.target.value)}
                      placeholder="Décrivez ce fichier : rôle dans le projet, sections à alimenter, points saillants…"
                      rows={2}
                      className="text-sm"
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="flex items-center justify-end gap-3 border-t border-rule pt-6">
            <button
              type="button"
              onClick={() => navigate({ to: "/dashboard" })}
              className="rounded-md px-4 py-2 text-sm text-ink-soft hover:text-ink"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={submit}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            >
              {requiresSource ? "Lancer la correction" : "Générer le plan"}
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
