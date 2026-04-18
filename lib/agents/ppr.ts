import { callVisionModel } from "@/lib/openrouter";
import type { AgentInput, AgentOutput } from "./types";
import { loadSkill } from "@/lib/skills/load";
import { parseAgentOutput } from "./parse";

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
    return parseAgentOutput(raw, "PPR");
  } catch (err) {
    return {
      docType: "PPR",
      status: "error",
      issues: [],
      summary: `Error during PPR check: ${(err as Error).message}`,
    };
  }
}
