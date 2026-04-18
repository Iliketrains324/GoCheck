/**
 * Client-side PDF utilities using pdf.js.
 * extractTextFromFile: structured text for text-based agents (fallback only).
 * renderPdfToImages: renders pages as JPEG base64 strings for vision agents.
 */

export async function extractTextFromFile(file: File): Promise<string> {
  const { getDocument, GlobalWorkerOptions } = await import("pdfjs-dist");
  GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: arrayBuffer }).promise;

  const pageTexts: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1.0 });
    const pageWidth = viewport.width;

    type RichItem = { x: number; y: number; w: number; h: number; text: string };
    const richItems: RichItem[] = [];

    for (const item of content.items) {
      if (!("str" in item)) continue;
      const s = item.str;
      if (!s.trim()) continue;
      richItems.push({
        x: item.transform[4],
        y: item.transform[5],
        w: item.width ?? 0,
        h: item.height ?? 12,
        text: s,
      });
    }

    if (richItems.length === 0) continue;

    // Group items into lines: items within 4px y-tolerance share a line.
    // PDF y=0 is at the bottom, so higher y = higher on the page.
    const lines: RichItem[][] = [];
    for (const item of richItems) {
      const existing = lines.find(
        (l) => l.length > 0 && Math.abs(l[0].y - item.y) <= 4
      );
      if (existing) {
        existing.push(item);
      } else {
        lines.push([item]);
      }
    }

    // Sort lines top-to-bottom (descending y), items within each line left-to-right.
    lines.sort((a, b) => b[0].y - a[0].y);
    for (const line of lines) line.sort((a, b) => a.x - b.x);

    const outputLines: string[] = [];
    let prevY: number | null = null;
    let prevH = 12;

    for (const line of lines) {
      const y = line[0].y;
      const h = Math.max(...line.map((i) => i.h));

      // Large gap between lines → paragraph break (insert blank line).
      if (prevY !== null && prevY - y > prevH * 2.5) {
        outputLines.push("");
      }

      // Table row detection: 3+ items spanning > 20% of page width.
      const xMin = line[0].x;
      const xMax = line[line.length - 1].x + (line[line.length - 1].w || 0);
      const isTableRow = line.length >= 3 && xMax - xMin > pageWidth * 0.2;

      const lineText = isTableRow
        ? line.map((i) => i.text.trim()).filter(Boolean).join(" | ")
        : line.map((i) => i.text).join(" ").trim();

      if (lineText) outputLines.push(lineText);
      prevY = y;
      prevH = h;
    }

    pageTexts.push(outputLines.join("\n"));
  }

  return pageTexts.join("\n\n").trim();
}

/**
 * Renders each PDF page to a base64 JPEG string for vision model input.
 * @param scale     Render scale (higher = sharper text, larger file)
 * @param maxPages  Cap on pages rendered
 * @param sections  If > 0, also append N horizontal strip crops per page after
 *                  the full-page image. Strips overlap by 8% so no content is
 *                  cut at boundaries. Used by AFORM to zoom in on checkbox areas.
 */
export async function renderPdfToImages(
  file: File,
  { scale = 1.5, maxPages = 10, sections = 0 }: { scale?: number; maxPages?: number; sections?: number } = {}
): Promise<string[]> {
  const { getDocument, GlobalWorkerOptions } = await import("pdfjs-dist");
  GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: arrayBuffer }).promise;
  const images: string[] = [];

  for (let i = 1; i <= Math.min(pdf.numPages, maxPages); i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d")!;
    await page.render({ canvasContext: ctx, viewport }).promise;

    // Full page image
    images.push(canvas.toDataURL("image/jpeg", 0.92));

    // Horizontal strip crops (for dense checkbox forms like AFORM)
    if (sections > 0) {
      const overlapPx = Math.round(canvas.height * 0.08);
      const stripH = Math.ceil(canvas.height / sections);

      for (let s = 0; s < sections; s++) {
        const srcY = Math.max(0, s * stripH - overlapPx);
        const srcH = Math.min(canvas.height - srcY, stripH + overlapPx * 2);
        const crop = document.createElement("canvas");
        crop.width = canvas.width;
        crop.height = srcH;
        crop.getContext("2d")!.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);
        images.push(crop.toDataURL("image/jpeg", 0.92));
      }
    }
  }

  return images;
}
