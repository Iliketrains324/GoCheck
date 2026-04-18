import { callModel, REASONING_MODEL } from "@/lib/openrouter";
import type { AgentInput, AgentOutput } from "./types";
import type { DocResult } from "@/lib/supabase";
import { loadSkill } from "@/lib/skills/load";
import { parseAgentOutput } from "./parse";

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
    const result = parseAgentOutput(raw, "AFORM");
    return {
      ...result,
      issues: result.issues.map((i) => ({ ...i, field: `[Cross-doc] ${i.field}` })),
    };
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

