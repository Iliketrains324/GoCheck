import { callVisionModel } from "@/lib/openrouter";
import type { AgentInput, AgentOutput } from "./types";
import { loadSkill } from "@/lib/skills/load";

const SYSTEM_PROMPT = loadSkill("ppr");

const USER_PROMPT = `Please review all pages of this Project Proposal Form (PPR) carefully.
Check every section against the rules in the system prompt.
Return a JSON object with all violations found.`;

export async function checkPpr(input: AgentInput): Promise<AgentOutput> {
  const { pages } = input;

  if (!pages || pages.length === 0) {
    return {
      docType: "PPR",
      status: "error",
      issues: [],
      summary: "No page images provided for PPR vision check.",
    };
  }

  try {
    const raw = await callVisionModel(SYSTEM_PROMPT, USER_PROMPT, pages, input.onToken);
    return parseAgentResponse(raw);
  } catch (err) {
    return {
      docType: "PPR",
      status: "error",
      issues: [],
      summary: `Error during PPR check: ${(err as Error).message}`,
    };
  }
}

function parseAgentResponse(raw: string): AgentOutput {
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON found");
    const parsed = JSON.parse(match[0]);
    return {
      docType: "PPR",
      status: parsed.status ?? "ok",
      issues: parsed.issues ?? [],
      summary: parsed.summary ?? "Check complete.",
    };
  } catch {
    return {
      docType: "PPR",
      status: "has_issues",
      issues: [
        {
          field: "Parse Error",
          problem: "Could not parse AI response",
          suggestion: "Please re-run the check.",
          severity: "minor",
        },
      ],
      summary: "Unable to parse check results. Raw: " + raw.slice(0, 200),
    };
  }
}
