import { callModel, REASONING_MODEL } from "@/lib/openrouter";
import type { AgentInput, AgentOutput } from "./types";
import type { DocResult } from "@/lib/supabase";
import { loadSkill } from "@/lib/skills/load";

const SYSTEM_PROMPT = loadSkill("coherence");

export async function checkCoherence(input: AgentInput): Promise<AgentOutput> {
  const { allResults } = input;

  if (!allResults || Object.keys(allResults).length < 2) {
    return {
      docType: "AFORM",
      status: "ok",
      issues: [],
      summary: "Only one document submitted — no cross-document coherence check needed.",
    };
  }

  const docSummaries = buildDocSummaries(allResults);

  const messages = [
    { role: "system" as const, content: SYSTEM_PROMPT },
    {
      role: "user" as const,
      content: `Here are the individual check results for the submitted documents.
Look for any cross-document inconsistencies and return the JSON result.

${docSummaries}`,
    },
  ];

  try {
    const raw = await callModel(messages, REASONING_MODEL, { maxTokens: 4096, onToken: input.onToken });
    return parseCoherenceResponse(raw);
  } catch (err) {
    return {
      docType: "AFORM",
      status: "error",
      issues: [],
      summary: `Coherence check error: ${(err as Error).message}`,
    };
  }
}

function buildDocSummaries(allResults: Record<string, DocResult>): string {
  return Object.entries(allResults)
    .map(([docType, result]) => {
      const issueList =
        result.issues.length > 0
          ? result.issues.map((i) => `  - [${i.field}] ${i.problem}`).join("\n")
          : "  (no individual issues found)";

      return `=== ${docType} ===
Status: ${result.status}
Summary: ${result.summary}
Individual Issues:
${issueList}
${result.rawText ? `\nExtracted Text (excerpt):\n${result.rawText.slice(0, 1500)}` : ""}`;
    })
    .join("\n\n");
}

function parseCoherenceResponse(raw: string): AgentOutput {
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found");
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      docType: "AFORM",
      status: parsed.status ?? "ok",
      issues: (parsed.issues ?? []).map((i: AgentOutput["issues"][0]) => ({
        ...i,
        field: `[Cross-doc] ${i.field}`,
      })),
      summary: parsed.summary ?? "Coherence check complete.",
    };
  } catch {
    return {
      docType: "AFORM",
      status: "ok",
      issues: [],
      summary: "Coherence check completed.",
    };
  }
}
