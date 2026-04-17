/**
 * Client-side PDF text extraction using pdf.js.
 * Preserves paragraph breaks and table column structure using positional data.
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
