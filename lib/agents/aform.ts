import { callVisionModel } from "@/lib/openrouter";
import type { AgentInput, AgentOutput } from "./types";
import { loadSkill } from "@/lib/skills/load";
import { parseAgentOutput } from "./parse";

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
    return parseAgentOutput(raw, "AFORM");
  } catch (err) {
    return {
      docType: "AFORM",
      status: "error",
      issues: [],
      summary: `Error during AFORM check: ${(err as Error).message}`,
    };
  }
}
