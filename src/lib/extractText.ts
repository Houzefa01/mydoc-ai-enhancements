/**
 * Extraction du texte des fichiers source, côté navigateur.
 *
 * Elle alimente `extracted_text` : c'est ce texte qui sert au calcul du coût
 * en crédits d'une correction (nombre de mots) et au prompt de correction.
 */

/** Longueur maximale conservée en base pour un fichier. */
const MAX_CHARS = 200_000;

function clean(text: string): string {
  return text.replace(/\r/g, "").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

async function extractPdf(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const parts: string[] = [];
  for (let page = 1; page <= doc.numPages; page += 1) {
    const content = await (await doc.getPage(page)).getTextContent();
    parts.push(
      content.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ")
        .replace(/\s+/g, " "),
    );
    if (parts.join("\n").length > MAX_CHARS) break;
  }
  return parts.join("\n\n");
}

async function extractDocx(file: File): Promise<string> {
  const mammoth = (await import("mammoth/mammoth.browser.js")) as unknown as {
    extractRawText: (input: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string }>;
  };
  const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return result.value;
}

/** Nombre de mots d'un texte extrait. */
export function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

/**
 * Renvoie le texte du fichier, ou une erreur explicite si le format est
 * illisible (PDF scanné sans couche texte, fichier protégé…).
 */
export async function extractFileText(
  file: File,
  kind: "pdf" | "docx" | "txt" | "image",
): Promise<{ text: string } | { error: string }> {
  try {
    let raw = "";
    if (kind === "pdf") raw = await extractPdf(file);
    else if (kind === "docx") {
      if (!file.name.toLowerCase().endsWith(".docx"))
        return {
          error:
            "Seul le format .docx est lisible automatiquement : convertissez le fichier avant de l'importer.",
        };
      raw = await extractDocx(file);
    } else if (kind === "txt") raw = await file.text();
    else return { text: "" };

    const text = clean(raw).slice(0, MAX_CHARS);
    if (kind !== "txt" && wordCount(text) < 5)
      return {
        error:
          "Aucun texte n'a pu être extrait de ce fichier (document scanné ou protégé). Importez une version contenant du texte sélectionnable.",
      };
    return { text };
  } catch {
    return { error: "Lecture du fichier impossible : le document semble endommagé ou protégé." };
  }
}
