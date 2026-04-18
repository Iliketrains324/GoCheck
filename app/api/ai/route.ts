/**
 * Server-side AI proxy — keeps OPENROUTER_API_KEY out of the browser bundle.
 * Uses Edge runtime so streaming works without Vercel timeout issues.
 */
import { NextRequest } from "next/server";

export const runtime = "edge";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// Basic allow-list to prevent arbitrary model abuse
const ALLOWED_MODELS = new Set([
  "google/gemini-2.5-flash-preview",
  "deepseek/deepseek-chat",
]);

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || !body.model || !body.messages) {
    return new Response(JSON.stringify({ error: "Invalid request" }), { status: 400 });
  }
  if (!ALLOWED_MODELS.has(body.model)) {
    return new Response(JSON.stringify({ error: "Model not allowed" }), { status: 403 });
  }

  const upstream = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://gocheck-psi.vercel.app",
      "X-Title": "GoCheck - CSO Document Checker",
    },
    body: JSON.stringify({
      model: body.model,
      messages: body.messages,
      temperature: body.temperature ?? 0.2,
      max_tokens: body.max_tokens ?? 4096,
      stream: true,
    }),
  });

  if (!upstream.ok) {
    const err = await upstream.text();
    return new Response(JSON.stringify({ error: err }), { status: upstream.status });
  }

  // Pipe the SSE stream straight back to the browser
  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
