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

/**
 * Shared grammar and human-error checks appended to every document prompt.
 * Designed to catch real mistakes without over-flagging stylistic choices.
 */
export const WRITING_CHECKS = `
GRAMMAR AND HUMAN ERROR CHECKS
Flag the following in addition to the document-specific rules above.
Use severity "minor" unless the error makes critical information unintelligible (then "major").

1. PLACEHOLDER TEXT — Flag any of these left unfilled:
   - [Bracketed placeholders] that were never replaced with real content
   - Template instructions still present (e.g., "Write answer here", "Insert name", "Type here")
   - "TBD" or "???" used where actual information is clearly required

2. TRUNCATED / INCOMPLETE SENTENCES — Flag a sentence that begins a thought but cuts off
   before it is complete (e.g., "The activity aims to" with nothing following).

3. SENTENCE FRAGMENTS in prose sections — Flag a phrase in a paragraph or formal statement
   that has no subject or no main verb. Note: short-form entries in table cells, numbered
   lists, and bullet points are acceptable and should NOT be flagged.

4. ACCIDENTALLY REPEATED WORDS — Flag unintentional word duplication
   (e.g., "the the event", "will will be held", "for for").

5. OBVIOUS MISSPELLINGS of key terms — Flag clear misspellings of:
   - The organization's own name as it appears elsewhere in the document
   - DLSU institution names (e.g., "De La Salle Univrsity")
   - High-frequency words: "participants", "committee", "activity", "objectives", "guidelines"
   Be conservative: do not flag Filipino proper nouns, names, or org-specific terminology
   you are not certain about.

6. BLANK REQUIRED FIELDS — Flag any field, row, or section that is visibly empty when
   context clearly requires it to be filled in. Do not flag fields correctly left as N/A.

7. INTERNAL CONTRADICTIONS — Flag when two parts of the same document state different
   values for the same fact (e.g., two different dates listed for the same event, or the
   activity title written differently in two sections).

CALIBRATION — Do NOT flag:
- Casual phrasing, informal tone, or stylistic word choices
- Sentences that are awkward but still clear in meaning
- Standard CSO abbreviations (TL, YL, F2F, ORGRES, ENMP, etc.)
- Proper nouns and Filipino names that look unusual but may be correct
- Minor punctuation preferences (Oxford comma, etc.)
Only flag errors a careful proofreader would unambiguously mark as wrong.
`;

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
