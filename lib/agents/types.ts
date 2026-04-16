import type { DocType, DocResult, IssueItem } from "@/lib/supabase";

export type { DocType, DocResult, IssueItem };

export interface AgentInput {
  docType: DocType;
  /** Extracted plain text (for non-AFORM documents) */
  text?: string;
  /** Base64 PNG page images (for AFORM vision) */
  pages?: string[];
  /** For coherence: all other doc results */
  allResults?: Record<string, DocResult>;
  /** Optional streaming token callback */
  onToken?: (token: string) => void;
}

export interface AgentOutput {
  docType: DocType;
  status: "ok" | "has_issues" | "error";
  issues: IssueItem[];
  summary: string;
}

// JSON schema the model must follow
export const ISSUE_SCHEMA = `
Return a JSON object with this exact structure:
{
  "status": "ok" | "has_issues",
  "summary": "one-sentence summary",
  "issues": [
    {
      "field": "name of the form field or section",
      "problem": "specific description of what is wrong",
      "suggestion": "exact correction text or instruction",
      "severity": "major" | "minor"
    }
  ]
}

Rules:
- "major" severity = causes pend/rejection; "minor" = advisory/formatting
- If no issues found, return status "ok" and empty issues array
- Be specific in field names (e.g. "Section I - Title of Activity" not just "title")
- Do NOT include issues that are not violations of the checking guide
- NEVER flag cross-document inconsistencies or "cannot verify against [other doc]" issues. You only have access to THIS document's text. Cross-document checks are handled by a separate coherence agent.
`;
