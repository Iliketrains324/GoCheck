/**
 * Server-side PDF text extraction using pdf-parse.
 * AFORM uses vision (client-rendered images) — this is for all other doc types.
 */

export async function extractTextFromBuffer(buffer: Buffer): Promise<string> {
  // Dynamic import to avoid issues with server/client bundling
  const pdfParse = (await import("pdf-parse")).default;
  const data = await pdfParse(buffer);
  return data.text;
}

export async function extractTextFromBase64(base64: string): Promise<string> {
  const buffer = Buffer.from(base64, "base64");
  return extractTextFromBuffer(buffer);
}
