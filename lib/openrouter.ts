import OpenAI from "openai";

function getClient(): OpenAI {
  return new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.NEXT_PUBLIC_OPENROUTER_API_KEY ?? "",
    dangerouslyAllowBrowser: true, // agents run client-side; key is intentionally public
    defaultHeaders: {
      "HTTP-Referer": "https://gocheck-psi.vercel.app",
      "X-Title": "GoCheck - CSO Document Checker",
    },
  });
}

export const openrouter = {
  chat: {
    completions: {
      create: (params: Parameters<OpenAI["chat"]["completions"]["create"]>[0]) =>
        getClient().chat.completions.create(params),
    },
  },
};

// Vision model for AFORM (PDF pages as images)
export const VISION_MODEL = "qwen/qwen2.5-vl-72b-instruct";
// Text model for all non-AFORM documents
export const TEXT_MODEL = "deepseek/deepseek-chat";
// Coherence checker — deepseek-chat is fast enough and won't timeout on Vercel
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
  opts?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const response = await getClient().chat.completions.create({
    model,
    messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
    temperature: opts?.temperature ?? 0.2,
    max_tokens: opts?.maxTokens ?? 4096,
  }) as OpenAI.Chat.ChatCompletion;
  return response.choices[0]?.message?.content ?? "";
}

export async function callVisionModel(
  systemPrompt: string,
  userText: string,
  pageImages: string[] // base64 PNG data URIs
): Promise<string> {
  const imageContent = pageImages.map((img) => ({
    type: "image_url" as const,
    image_url: { url: img.startsWith("data:") ? img : `data:image/png;base64,${img}` },
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

  return callModel(messages, VISION_MODEL, { maxTokens: 4096 });
}
