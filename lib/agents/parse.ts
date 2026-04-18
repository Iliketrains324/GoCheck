import type { AgentOutput, DocType } from "./types";

const NO_FIX_EXACT = /^(none|n\/a|no fix( needed| required)?|no action( needed| required)?|no change( needed| required)?|no correction( needed| required)?|nothing( needed| required)?)[\s.,;!]*$/i;
const NO_FIX_PREFIX = /^fix:\s*(none|n\/a|no fix|no action|no change|no correction|nothing)/i;

function isActionable(suggestion: unknown): boolean {
  if (!suggestion || typeof suggestion !== "string") return false;
  const t = suggestion.trim();
  return !NO_FIX_EXACT.test(t) && !NO_FIX_PREFIX.test(t);
}

/**
 * Parses raw AI JSON output, strips issues with no actionable fix,
 * and recalculates status. Used by every agent.
 */
export function parseAgentOutput(raw: string, docType: DocType): AgentOutput {
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON found");
    const parsed = JSON.parse(match[0]);

    const allIssues: AgentOutput["issues"] = parsed.issues ?? [];
    const issues = allIssues.filter((issue) => isActionable(issue.suggestion));

    return {
      docType,
      status: issues.length > 0 ? "has_issues" : "ok",
      issues,
      summary: parsed.summary ?? "Check complete.",
    };
  } catch {
    return {
      docType,
      status: "has_issues",
      issues: [{ field: "Parse Error", problem: "Could not parse AI response", suggestion: "Re-run the check.", severity: "minor" }],
      summary: "Unable to parse check results.",
    };
  }
}
