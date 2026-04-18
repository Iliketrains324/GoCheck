import { callVisionModel } from "@/lib/openrouter";
import type { AgentInput, AgentOutput } from "./types";
import { loadSkill } from "@/lib/skills/load";

const SYSTEM_PROMPT = loadSkill("aform");

export async function checkAform(input: AgentInput): Promise<AgentOutput> {
  const { pages } = input;

  if (!pages || pages.length === 0) {
    return {
      docType: "AFORM",
      status: "error",
      issues: [],
      summary: "No page images provided for AFORM vision check.",
    };
  }

  const userPrompt = `Please analyze this Activity Approval Form (A-Form) carefully.
Look at every field and checkbox visible in the form images.
Check each field against the rules in the system prompt.
Return a JSON object with all violations found.`;

  try {
    const raw = await callVisionModel(SYSTEM_PROMPT, userPrompt, pages, input.onToken);
    return parseAgentResponse(raw, "AFORM");
  } catch (err) {
    return {
      docType: "AFORM",
      status: "error",
      issues: [],
      summary: `Error during AFORM check: ${(err as Error).message}`,
    };
  }
}

function parseAgentResponse(raw: string, docType: AgentInput["docType"]): AgentOutput {
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      docType,
      status: parsed.status ?? "ok",
      issues: parsed.issues ?? [],
      summary: parsed.summary ?? "Check complete.",
    };
  } catch {
    return {
      docType,
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
