// Génération réelle des fichiers d'export, côté navigateur.
// PDF : écrit à la main (texte Helvetica, encodage WinAnsi).
// DOCX / PPTX : paquets OOXML assemblés dans un ZIP.
// LaTeX / Beamer : sources .tex.

import type { DocumentType, ExportFormat, Section } from "@/backend/types";
import { createZip, type ZipEntry } from "./zip";

export interface ExportInput {
  title: string;
  description: string;
  type: DocumentType;
  author?: string;
  sections: Section[];
}

export interface BuiltExport {
  blob: Blob;
  extension: string;
  mimeType: string;
}

// ---------- helpers ----------

export function blockLines(section: Section): string[] {
  const lines: string[] = [];
  for (const b of section.blocks) {
    if (b.kind === "paragraph" && b.text) lines.push(b.text);
    if (b.kind === "list") for (const item of b.items ?? []) lines.push(`• ${item}`);
    if (b.kind === "table") for (const row of b.rows ?? []) lines.push(row.join(" | "));
    if (b.kind === "image") lines.push(b.caption ? `[Image — ${b.caption}]` : "[Image]");
  }
  return lines;
}

function wrap(text: string, maxChars: number): string[] {
  const out: string[] = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const word of paragraph.split(/\s+/)) {
      if (!word) continue;
      if ((line + " " + word).trim().length > maxChars) {
        if (line) out.push(line);
        line = word;
      } else {
        line = (line ? line + " " : "") + word;
      }
    }
    out.push(line);
  }
  return out;
}

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function slugify(value: string): string {
  return (
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase()
      .slice(0, 60) || "document"
  );
}

// ---------- PDF ----------

function pdfEscape(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function latin1Bytes(value: string): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(new ArrayBuffer(value.length));
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    out[i] = code < 256 ? code : 63; // '?'
  }
  return out;
}

interface PdfLine {
  text: string;
  size: number;
  bold: boolean;
  spaceBefore: number;
}

function buildPdf(input: ExportInput): BuiltExport {
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 64;
  const bottom = 64;

  const lines: PdfLine[] = [];
  lines.push({ text: input.title, size: 22, bold: true, spaceBefore: 0 });
  if (input.description) {
    for (const l of wrap(input.description, 82))
      lines.push({ text: l, size: 10, bold: false, spaceBefore: 4 });
  }
  if (input.author) {
    lines.push({ text: input.author, size: 10, bold: false, spaceBefore: 8 });
  }

  input.sections.forEach((section, index) => {
    lines.push({
      text: `${index + 1}. ${section.title}`,
      size: 14,
      bold: true,
      spaceBefore: 22,
    });
    for (const raw of blockLines(section)) {
      const wrapped = wrap(raw, 92);
      wrapped.forEach((l, i) =>
        lines.push({ text: l, size: 11, bold: false, spaceBefore: i === 0 ? 8 : 0 }),
      );
    }
  });

  // Pagination
  const pages: string[][] = [];
  let current: string[] = [];
  let y = pageHeight - margin;

  const flush = () => {
    if (current.length) pages.push(current);
    current = [];
    y = pageHeight - margin;
  };

  for (const line of lines) {
    const lineHeight = line.size * 1.45;
    y -= line.spaceBefore;
    if (y - lineHeight < bottom) flush();
    y -= lineHeight;
    const font = line.bold ? "/F2" : "/F1";
    current.push(
      `BT ${font} ${line.size} Tf 1 0 0 1 ${margin.toFixed(2)} ${y.toFixed(2)} Tm (${pdfEscape(line.text)}) Tj ET`,
    );
  }
  flush();
  if (pages.length === 0) pages.push([]);

  // Objets PDF
  const objects: string[] = [];
  const pageCount = pages.length;
  const firstPageObj = 4;
  const kids = pages.map((_, i) => `${firstPageObj + i * 2} 0 R`).join(" ");

  objects[1] = `<< /Type /Catalog /Pages 2 0 R >>`;
  objects[2] = `<< /Type /Pages /Count ${pageCount} /Kids [${kids}] >>`;
  objects[3] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>`;
  const boldFontObj = firstPageObj + pageCount * 2;

  pages.forEach((content, i) => {
    const pageObj = firstPageObj + i * 2;
    const contentObj = pageObj + 1;
    objects[pageObj] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] ` +
      `/Resources << /Font << /F1 3 0 R /F2 ${boldFontObj} 0 R >> >> /Contents ${contentObj} 0 R >>`;
    const stream = content.join("\n");
    objects[contentObj] =
      `<< /Length ${latin1Bytes(stream).length} >>\nstream\n${stream}\nendstream`;
  });

  objects[boldFontObj] =
    `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>`;

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  for (let i = 1; i < objects.length; i++) {
    offsets[i] = latin1Bytes(pdf).length;
    pdf += `${i} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xrefOffset = latin1Bytes(pdf).length;
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let i = 1; i < objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return {
    blob: new Blob([latin1Bytes(pdf)], { type: "application/pdf" }),
    extension: "pdf",
    mimeType: "application/pdf",
  };
}

// ---------- DOCX ----------

function docxParagraph(text: string, style?: "Title" | "Heading1" | "ListBullet"): string {
  const pStyle = style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : "";
  return `<w:p>${pStyle}<w:r><w:t xml:space="preserve">${xmlEscape(text)}</w:t></w:r></w:p>`;
}

function buildDocx(input: ExportInput): BuiltExport {
  const body: string[] = [docxParagraph(input.title, "Title")];
  if (input.description) body.push(docxParagraph(input.description));
  if (input.author) body.push(docxParagraph(input.author));

  input.sections.forEach((section, i) => {
    body.push(docxParagraph(`${i + 1}. ${section.title}`, "Heading1"));
    for (const b of section.blocks) {
      if (b.kind === "paragraph" && b.text) body.push(docxParagraph(b.text));
      if (b.kind === "list")
        for (const item of b.items ?? []) body.push(docxParagraph(item, "ListBullet"));
      if (b.kind === "table")
        for (const row of b.rows ?? []) body.push(docxParagraph(row.join(" — ")));
      if (b.kind === "image")
        body.push(docxParagraph(b.caption ? `[Image — ${b.caption}]` : "[Image]"));
    }
  });

  const entries: ZipEntry[] = [
    {
      path: "[Content_Types].xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`,
    },
    {
      path: "_rels/.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`,
    },
    {
      path: "word/_rels/document.xml.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`,
    },
    {
      path: "word/styles.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:pPr><w:spacing w:after="240"/></w:pPr><w:rPr><w:b/><w:sz w:val="48"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:pPr><w:spacing w:before="360" w:after="120"/></w:pPr><w:rPr><w:b/><w:sz w:val="30"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="ListBullet"><w:name w:val="List Bullet"/><w:pPr><w:ind w:left="720"/></w:pPr></w:style>
</w:styles>`,
    },
    {
      path: "word/document.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body.join("")}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134"/></w:sectPr></w:body></w:document>`,
    },
  ];

  return {
    blob: createZip(entries),
    extension: "docx",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  };
}

// ---------- PPTX ----------

function pptxSlide(title: string, lines: string[]): string {
  const bodyParagraphs =
    lines.length > 0
      ? lines
          .map(
            (l) =>
              `<a:p><a:r><a:rPr lang="fr-FR" sz="1600" dirty="0"/><a:t>${xmlEscape(l)}</a:t></a:r></a:p>`,
          )
          .join("")
      : `<a:p><a:endParaRPr lang="fr-FR"/></a:p>`;

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
<p:cSld><p:spTree>
<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
<p:sp>
<p:nvSpPr><p:cNvPr id="2" name="Titre"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr/></p:nvSpPr>
<p:spPr><a:xfrm><a:off x="628650" y="457200"/><a:ext cx="7886700" cy="1143000"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr>
<p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr lang="fr-FR" sz="3200" b="1" dirty="0"/><a:t>${xmlEscape(title)}</a:t></a:r></a:p></p:txBody>
</p:sp>
<p:sp>
<p:nvSpPr><p:cNvPr id="3" name="Contenu"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr/></p:nvSpPr>
<p:spPr><a:xfrm><a:off x="628650" y="1700213"/><a:ext cx="7886700" cy="3600000"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr>
<p:txBody><a:bodyPr/><a:lstStyle/>${bodyParagraphs}</p:txBody>
</p:sp>
</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>`;
}

const PPTX_THEME = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="myDoc">
<a:themeElements>
<a:clrScheme name="myDoc"><a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1><a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="1F1B16"/></a:dk2><a:lt2><a:srgbClr val="F5F1EA"/></a:lt2><a:accent1><a:srgbClr val="8A6A3B"/></a:accent1><a:accent2><a:srgbClr val="4F6B7A"/></a:accent2><a:accent3><a:srgbClr val="7A5C4F"/></a:accent3><a:accent4><a:srgbClr val="6B7A4F"/></a:accent4><a:accent5><a:srgbClr val="4F5A7A"/></a:accent5><a:accent6><a:srgbClr val="7A4F6B"/></a:accent6><a:hlink><a:srgbClr val="0563C1"/></a:hlink><a:folHlink><a:srgbClr val="954F72"/></a:folHlink></a:clrScheme>
<a:fontScheme name="myDoc"><a:majorFont><a:latin typeface="Georgia"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont><a:minorFont><a:latin typeface="Helvetica"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont></a:fontScheme>
<a:fmtScheme name="myDoc">
<a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst>
<a:lnStyleLst><a:ln w="6350"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln w="12700"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln w="19050"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst>
<a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst>
<a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst>
</a:fmtScheme>
</a:themeElements><a:objectDefaults/><a:extraClrSchemeLst/></a:theme>`;

const PPTX_SLIDE_MASTER = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
<p:cSld><p:bg><p:bgPr><a:solidFill><a:schemeClr val="lt1"/></a:solidFill><a:effectLst/></p:bgPr></p:bg>
<p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
</p:spTree></p:cSld>
<p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>
<p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>
</p:sldMaster>`;

const PPTX_SLIDE_LAYOUT = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank" preserve="1">
<p:cSld name="Vide"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>`;

function buildPptx(input: ExportInput): BuiltExport {
  const slides: { title: string; lines: string[] }[] = [
    {
      title: input.title,
      lines: [input.description, input.author ?? ""].filter(Boolean) as string[],
    },
    ...input.sections.map((s) => ({
      title: s.title,
      lines: blockLines(s)
        .flatMap((l) => wrap(l, 78))
        .slice(0, 12),
    })),
  ];

  const entries: ZipEntry[] = [
    {
      path: "[Content_Types].xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
<Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
<Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
<Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
${slides
  .map(
    (_, i) =>
      `<Override PartName="/ppt/slides/slide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`,
  )
  .join("\n")}
</Types>`,
    },
    {
      path: "_rels/.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>`,
    },
    {
      path: "ppt/presentation.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
<p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>
<p:sldIdLst>${slides.map((_, i) => `<p:sldId id="${256 + i}" r:id="rId${i + 2}"/>`).join("")}</p:sldIdLst>
<p:sldSz cx="9144000" cy="6858000"/><p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>`,
    },
    {
      path: "ppt/_rels/presentation.xml.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>
${slides
  .map(
    (_, i) =>
      `<Relationship Id="rId${i + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${i + 1}.xml"/>`,
  )
  .join("\n")}
<Relationship Id="rId${slides.length + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/>
</Relationships>`,
    },
    { path: "ppt/slideMasters/slideMaster1.xml", content: PPTX_SLIDE_MASTER },
    {
      path: "ppt/slideMasters/_rels/slideMaster1.xml.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>
</Relationships>`,
    },
    { path: "ppt/slideLayouts/slideLayout1.xml", content: PPTX_SLIDE_LAYOUT },
    {
      path: "ppt/slideLayouts/_rels/slideLayout1.xml.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>
</Relationships>`,
    },
    { path: "ppt/theme/theme1.xml", content: PPTX_THEME },
  ];

  slides.forEach((slide, i) => {
    entries.push({
      path: `ppt/slides/slide${i + 1}.xml`,
      content: pptxSlide(slide.title, slide.lines),
    });
    entries.push({
      path: `ppt/slides/_rels/slide${i + 1}.xml.rels`,
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
</Relationships>`,
    });
  });

  return {
    blob: createZip(entries),
    extension: "pptx",
    mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  };
}

// ---------- LaTeX ----------

function texEscape(value: string): string {
  return value
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/([&%$#_{}])/g, "\\$1")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}");
}

function texBody(section: Section, environment: "article" | "beamer"): string {
  const parts: string[] = [];
  for (const b of section.blocks) {
    if (b.kind === "paragraph" && b.text) parts.push(texEscape(b.text));
    if (b.kind === "list" && (b.items?.length ?? 0) > 0) {
      parts.push(
        `\\begin{itemize}\n${(b.items ?? [])
          .map((i) => `  \\item ${texEscape(i)}`)
          .join("\n")}\n\\end{itemize}`,
      );
    }
    if (b.kind === "table" && (b.rows?.length ?? 0) > 0) {
      const rows = b.rows ?? [];
      const cols = Math.max(...rows.map((r) => r.length));
      parts.push(
        `\\begin{tabular}{${"l".repeat(cols)}}\n\\hline\n${rows
          .map((r) => r.map(texEscape).join(" & ") + " \\\\")
          .join("\n")}\n\\hline\n\\end{tabular}`,
      );
    }
    if (b.kind === "image") {
      parts.push(
        environment === "beamer"
          ? `\\textit{${texEscape(b.caption ?? "Image")}}`
          : `\\begin{figure}[h]\\centering\\fbox{Image}\\caption{${texEscape(b.caption ?? "Illustration")}}\\end{figure}`,
      );
    }
  }
  return parts.join("\n\n");
}

function buildLatex(input: ExportInput): BuiltExport {
  const content = input.sections
    .map((s) => `\\section{${texEscape(s.title)}}\n${texBody(s, "article")}`)
    .join("\n\n");

  const tex = `\\documentclass[11pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage[french]{babel}
\\usepackage{geometry}
\\geometry{margin=2.5cm}
\\title{${texEscape(input.title)}}
\\author{${texEscape(input.author ?? "")}}
\\date{\\today}

\\begin{document}
\\maketitle
${input.description ? `\\begin{abstract}\n${texEscape(input.description)}\n\\end{abstract}\n` : ""}\\tableofcontents
\\newpage

${content}

\\end{document}
`;

  return {
    blob: new Blob([tex], { type: "application/x-tex" }),
    extension: "tex",
    mimeType: "application/x-tex",
  };
}

function buildBeamer(input: ExportInput): BuiltExport {
  const frames = input.sections
    .map((s) => `\\begin{frame}{${texEscape(s.title)}}\n${texBody(s, "beamer")}\n\\end{frame}`)
    .join("\n\n");

  const tex = `\\documentclass[aspectratio=169]{beamer}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage[french]{babel}
\\usetheme{Madrid}
\\title{${texEscape(input.title)}}
\\author{${texEscape(input.author ?? "")}}
\\date{\\today}

\\begin{document}
\\frame{\\titlepage}
${input.description ? `\\begin{frame}{Contexte}\n${texEscape(input.description)}\n\\end{frame}\n` : ""}
${frames}

\\end{document}
`;

  return {
    blob: new Blob([tex], { type: "application/x-tex" }),
    extension: "tex",
    mimeType: "application/x-tex",
  };
}

// ---------- entrée publique ----------

export function buildExport(format: ExportFormat, input: ExportInput): BuiltExport {
  switch (format) {
    case "pdf":
      return buildPdf(input);
    case "docx":
      return buildDocx(input);
    case "pptx":
      return buildPptx(input);
    case "latex":
      return buildLatex(input);
    case "beamer":
      return buildBeamer(input);
  }
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
