// Vision model for AFORM (PDF pages as images)
export const VISION_MODEL = "google/gemini-2.5-flash-preview";
// Text model for all non-AFORM documents
export const TEXT_MODEL = "deepseek/deepseek-chat";
// Coherence checker
export const REASONING_MODEL = "deepseek/deepseek-chat";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content:
    | string
    | Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }>;
}

export async function callModel(
  messages: ChatMessage[],
  model: string = TEXT_MODEL,
  opts?: { temperature?: number; maxTokens?: number; onToken?: (token: string) => void }
): Promise<string> {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages,
      temperature: opts?.temperature ?? 0.2,
      max_tokens: opts?.maxTokens ?? 4096,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => res.statusText);
    throw new Error(`AI proxy error ${res.status}: ${body}`);
  }

  // Read SSE stream and accumulate content
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let fullContent = "";
  let buf = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]") continue;
      try {
        const parsed = JSON.parse(data);
        const token = parsed.choices?.[0]?.delta?.content ?? "";
        if (token) {
          fullContent += token;
          opts?.onToken?.(token);
        }
      } catch {
        // ignore malformed SSE lines
      }
    }
  }

  return fullContent;
}

export async function callVisionModel(
  systemPrompt: string,
  userText: string,
  pageImages: string[],
  onToken?: (token: string) => void
): Promise<string> {
  const imageContent = pageImages.map((img) => ({
    type: "image_url" as const,
    image_url: { url: img.startsWith("data:") ? img : `data:image/jpeg;base64,${img}` },
  }));

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: [
        { type: "text", text: userText },
        ...imageContent,
      ],
    },
  ];

  return callModel(messages, VISION_MODEL, { maxTokens: 4096, onToken });
}
