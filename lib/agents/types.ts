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
