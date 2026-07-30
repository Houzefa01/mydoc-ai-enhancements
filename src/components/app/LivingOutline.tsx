import { useState } from "react";
import { GripVertical, Loader2, Plus, Trash2 } from "lucide-react";
import type { Section } from "@/backend/types";
import { cn } from "@/lib/utils";

// Élément signature : le mini plan vivant. Ce composant reflète en temps
// réel la structure du document, permet de réordonner (glisser-déposer natif
// HTML5), renommer, supprimer et ajouter une section.

interface Props {
  sections: Section[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onReorder: (nextSections: Section[]) => void;
  onRename?: (id: string, title: string) => void;
  onRemove?: (id: string) => void;
  onAdd?: () => void;
  editable?: boolean;
}

export function LivingOutline({
  sections,
  activeId,
  onSelect,
  onReorder,
  onRename,
  onRemove,
  onAdd,
  editable = true,
}: Props) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const from = sections.findIndex((s) => s.id === dragId);
    const to = sections.findIndex((s) => s.id === targetId);
    if (from < 0 || to < 0) return;
    const next = [...sections];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onReorder(next);
    setDragId(null);
  };

  return (
    // Collant uniquement quand il occupe une colonne dédiée (>= lg) :
    // empilé sous l'en-tête, il se superposerait au document.
    <aside className="flex h-fit w-full flex-col gap-3 rounded-md bg-paper lg:sticky lg:top-24 lg:z-10">
      <div className="flex items-baseline justify-between border-b border-rule pb-2">
        <h2 className="font-editorial text-sm uppercase tracking-[0.18em] text-ink-mute">
          Sommaire
        </h2>
        <span className="font-numeric text-xs text-ink-mute">
          {String(sections.length).padStart(2, "0")}
        </span>
      </div>

      <ol className="flex flex-col">
        {sections.map((s, index) => {
          const active = s.id === activeId;
          return (
            <li
              key={s.id}
              draggable={editable && editingId !== s.id}
              onDragStart={() => setDragId(s.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(s.id)}
              className={cn(
                "group relative flex items-start gap-2 border-l-2 py-2 pl-3 pr-2 transition",
                active
                  ? "border-primary bg-accent/60"
                  : "border-transparent hover:border-rule hover:bg-paper-deep/60",
              )}
            >
              <span className="mt-0.5 font-numeric text-[11px] text-ink-mute tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </span>

              {editingId === s.id && onRename ? (
                <input
                  autoFocus
                  defaultValue={s.title}
                  onBlur={(e) => {
                    onRename(s.id, e.target.value.trim() || s.title);
                    setEditingId(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  className="flex-1 border-b border-primary bg-transparent text-sm text-ink outline-none"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => onSelect(s.id)}
                  onDoubleClick={() => editable && onRename && setEditingId(s.id)}
                  className={cn(
                    "flex-1 text-left text-sm leading-snug",
                    active ? "text-ink" : "text-ink-soft group-hover:text-ink",
                  )}
                >
                  {s.title}
                </button>
              )}

              {s.generating && (
                <Loader2 className="mt-1 h-3.5 w-3.5 shrink-0 animate-spin text-primary" />
              )}

              {editable && (
                <div className="flex items-center opacity-0 transition group-hover:opacity-100">
                  {onRemove && (
                    <button
                      type="button"
                      onClick={() => onRemove(s.id)}
                      className="rounded p-1 text-ink-mute hover:bg-paper-deep hover:text-destructive"
                      aria-label={`Supprimer ${s.title}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <span
                    className="cursor-grab rounded p-1 text-ink-mute hover:text-ink"
                    aria-hidden
                  >
                    <GripVertical className="h-3.5 w-3.5" />
                  </span>
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {editable && onAdd && (
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-2 self-start px-3 py-1.5 text-xs uppercase tracking-wider text-ink-mute hover:text-ink"
        >
          <Plus className="h-3.5 w-3.5" /> Ajouter une section
        </button>
      )}
    </aside>
  );
}
