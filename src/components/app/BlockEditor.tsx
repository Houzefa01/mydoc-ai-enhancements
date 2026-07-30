import {
  ChevronDown,
  ChevronUp,
  Columns3,
  Image as ImageIcon,
  List,
  Plus,
  Rows3,
  Table as TableIcon,
  Trash2,
  Type,
  X,
} from "lucide-react";
import type { SectionBlock } from "@/backend/types";
import { cn } from "@/lib/utils";

const iconBtn =
  "inline-flex h-7 w-7 items-center justify-center rounded border border-rule bg-card text-ink-mute transition hover:text-ink disabled:cursor-not-allowed disabled:opacity-40";

export function emptyBlock(kind: SectionBlock["kind"]): SectionBlock {
  if (kind === "list") return { kind: "list", items: ["Premier point"] };
  if (kind === "table")
    return {
      kind: "table",
      rows: [
        ["Colonne A", "Colonne B"],
        ["", ""],
      ],
    };
  if (kind === "image") return { kind: "image", url: "", caption: "" };
  return { kind: "paragraph", text: "" };
}

export function BlockEditor({
  blocks,
  onChange,
}: {
  blocks: SectionBlock[];
  onChange: (next: SectionBlock[]) => void;
}) {
  const update = (index: number, patch: Partial<SectionBlock>) =>
    onChange(blocks.map((b, i) => (i === index ? { ...b, ...patch } : b)));

  const remove = (index: number) => onChange(blocks.filter((_, i) => i !== index));

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-4">
      {blocks.map((block, i) => (
        <div key={i} className="group/block relative rounded-md">
          <div className="absolute -top-3 right-0 z-10 hidden gap-1 group-focus-within/block:flex group-hover/block:flex">
            <button
              type="button"
              aria-label="Monter le bloc"
              className={iconBtn}
              disabled={i === 0}
              onClick={() => move(i, -1)}
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              aria-label="Descendre le bloc"
              className={iconBtn}
              disabled={i === blocks.length - 1}
              onClick={() => move(i, 1)}
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              aria-label="Supprimer le bloc"
              className={cn(iconBtn, "hover:text-destructive")}
              onClick={() => remove(i)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>

          <BlockBody block={block} onPatch={(patch) => update(i, patch)} />
        </div>
      ))}

      <AddBlockBar onAdd={(kind) => onChange([...blocks, emptyBlock(kind)])} />
    </div>
  );
}

function BlockBody({
  block,
  onPatch,
}: {
  block: SectionBlock;
  onPatch: (patch: Partial<SectionBlock>) => void;
}) {
  if (block.kind === "paragraph") {
    return (
      <textarea
        value={block.text ?? ""}
        rows={Math.max(2, Math.ceil((block.text?.length ?? 0) / 90) + 1)}
        placeholder="Rédigez ce paragraphe…"
        onChange={(e) => onPatch({ text: e.target.value })}
        className="w-full resize-none rounded-md border border-transparent bg-transparent p-2 text-[15px] leading-relaxed text-ink outline-none transition placeholder:text-ink-mute focus:border-rule focus:bg-accent/30"
      />
    );
  }

  if (block.kind === "list") {
    const items = block.items ?? [];
    return (
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2">
            <span aria-hidden className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink-mute" />
            <input
              value={item}
              placeholder="Point de la liste"
              onChange={(e) =>
                onPatch({
                  items: items.map((it, j) => (j === i ? e.target.value : it)),
                })
              }
              className="w-full rounded border border-transparent bg-transparent px-1.5 py-1 text-[15px] text-ink outline-none focus:border-rule focus:bg-accent/30"
            />
            <button
              type="button"
              aria-label="Supprimer ce point"
              onClick={() => onPatch({ items: items.filter((_, j) => j !== i) })}
              className="mt-1 text-ink-mute transition hover:text-destructive"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
        <li>
          <button
            type="button"
            onClick={() => onPatch({ items: [...items, ""] })}
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
          >
            <Plus className="h-3.5 w-3.5" /> Ajouter un point
          </button>
        </li>
      </ul>
    );
  }

  if (block.kind === "table") {
    const rows = block.rows?.length ? block.rows : [[""]];
    const colCount = Math.max(...rows.map((r) => r.length));
    const normalized = rows.map((r) => {
      const copy = [...r];
      while (copy.length < colCount) copy.push("");
      return copy;
    });

    const setCell = (ri: number, ci: number, value: string) =>
      onPatch({
        rows: normalized.map((r, i) => (i === ri ? r.map((c, j) => (j === ci ? value : c)) : r)),
      });

    return (
      <div className="space-y-2">
        <div className="overflow-x-auto rounded-md border border-rule">
          <table className="w-full border-collapse text-sm">
            <tbody>
              {normalized.map((row, ri) => (
                <tr key={ri} className={ri === 0 ? "bg-paper-deep/60" : ""}>
                  {row.map((cell, ci) => (
                    <td key={ci} className="border border-rule p-0">
                      <input
                        value={cell}
                        placeholder={ri === 0 ? "En-tête" : "…"}
                        onChange={(e) => setCell(ri, ci, e.target.value)}
                        className={cn(
                          "w-full bg-transparent px-3 py-2 text-ink outline-none focus:bg-accent/40",
                          ri === 0 && "font-editorial",
                        )}
                      />
                    </td>
                  ))}
                  <td className="w-8 border border-rule px-1 text-center align-middle">
                    <button
                      type="button"
                      aria-label={`Supprimer la ligne ${ri + 1}`}
                      disabled={normalized.length <= 1}
                      onClick={() => onPatch({ rows: normalized.filter((_, i) => i !== ri) })}
                      className="text-ink-mute transition hover:text-destructive disabled:opacity-30"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap gap-3 text-xs">
          <button
            type="button"
            onClick={() => onPatch({ rows: [...normalized, Array(colCount).fill("")] })}
            className="inline-flex items-center gap-1.5 text-primary hover:underline"
          >
            <Rows3 className="h-3.5 w-3.5" /> Ajouter une ligne
          </button>
          <button
            type="button"
            onClick={() => onPatch({ rows: normalized.map((r) => [...r, ""]) })}
            className="inline-flex items-center gap-1.5 text-primary hover:underline"
          >
            <Columns3 className="h-3.5 w-3.5" /> Ajouter une colonne
          </button>
          <button
            type="button"
            disabled={colCount <= 1}
            onClick={() => onPatch({ rows: normalized.map((r) => r.slice(0, -1)) })}
            className="inline-flex items-center gap-1.5 text-ink-mute hover:text-destructive disabled:opacity-40"
          >
            <X className="h-3.5 w-3.5" /> Retirer la dernière colonne
          </button>
        </div>
      </div>
    );
  }

  // image
  return (
    <figure className="space-y-2">
      {block.url ? (
        <img
          src={block.url}
          alt={block.caption || "Illustration du document"}
          loading="lazy"
          className="max-h-72 w-full rounded-md border border-rule object-cover"
        />
      ) : (
        <div className="flex h-32 items-center justify-center rounded-md border border-dashed border-rule bg-paper-deep/40 text-xs text-ink-mute">
          Collez l'adresse d'une image ci-dessous
        </div>
      )}
      <input
        value={block.url ?? ""}
        placeholder="https://…"
        onChange={(e) => onPatch({ url: e.target.value })}
        className="w-full rounded border border-rule bg-card px-3 py-1.5 font-numeric text-xs text-ink outline-none focus:border-primary"
      />
      <input
        value={block.caption ?? ""}
        placeholder="Légende (optionnelle)"
        onChange={(e) => onPatch({ caption: e.target.value })}
        className="w-full rounded border border-transparent bg-transparent px-3 py-1 text-center text-xs text-ink-mute outline-none focus:border-rule focus:bg-accent/30"
      />
    </figure>
  );
}

const kinds: { kind: SectionBlock["kind"]; label: string; Icon: typeof Type }[] = [
  { kind: "paragraph", label: "Paragraphe", Icon: Type },
  { kind: "list", label: "Liste", Icon: List },
  { kind: "table", label: "Tableau", Icon: TableIcon },
  { kind: "image", label: "Image", Icon: ImageIcon },
];

export function AddBlockBar({ onAdd }: { onAdd: (kind: SectionBlock["kind"]) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-dashed border-rule pt-3">
      <span className="font-numeric text-[11px] uppercase tracking-wider text-ink-mute">
        Ajouter
      </span>
      {kinds.map(({ kind, label, Icon }) => (
        <button
          key={kind}
          type="button"
          onClick={() => onAdd(kind)}
          className="inline-flex items-center gap-1.5 rounded-md border border-rule bg-card px-2.5 py-1 text-xs text-ink-soft transition hover:border-primary hover:text-primary"
        >
          <Icon className="h-3.5 w-3.5" /> {label}
        </button>
      ))}
    </div>
  );
}
