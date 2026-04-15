/**
 * Coherence Agent — cross-document discrepancy checker.
 * Uses DeepSeek reasoning model to find inconsistencies across all submitted documents.
 */

import { callModel, REASONING_MODEL } from "@/lib/openrouter";
import type { AgentInput, AgentOutput } from "./types";
import { ISSUE_SCHEMA } from "./types";
import type { DocResult } from "@/lib/supabase";

const SYSTEM_PROMPT = `You are a senior document reviewer at De La Salle University Manila's
Council of Student Organizations (CSO). Your job is to find CROSS-DOCUMENT DISCREPANCIES
in a set of pre-activity documents submitted by a student organization.

You will receive summaries and key extracted data from multiple documents that were checked individually.
Even if each document passed its own individual check, they might have inconsistencies with each other.

CRITICAL FIELDS THAT MUST BE CONSISTENT ACROSS ALL DOCUMENTS:
1. Title of Activity — must be IDENTICAL (or very similar) in AFORM, PPR, Letter of Invitation, Meeting Agenda, Contest Mechanics, Recruitment Mechanics, Election Mechanics
2. Date of Activity — must be consistent across AFORM, PPR, and any supplementary documents
3. Time of Activity — must match in AFORM vs Meeting Agenda, Contest Mechanics, etc.
4. Venue of Activity — must be consistent (or "See PPR" noted in AFORM)
5. Nature of Activity — must match between AFORM and PPR
6. Type of Activity — must match between AFORM and PPR
7. ENMP/ENP (Expected Number of Members/Participants) — must match between AFORM and PPR
8. Number of Speakers — number of Letters of Invitation must equal the number of speakers listed
9. Venue Fee — if a venue fee is in PPR Section V, a VRT must be included
10. Speaker Classification — if Credentials say VIP/Distinguished, should be processed thru SLIFE (not APS)
11. Contest Prize Expenses — prize totals in Contest Mechanics must match PPR Section V
12. Budget totals — PPR Section V, VI, and VIII must be internally consistent

For each discrepancy found, specify:
- Which documents are inconsistent
- What the specific values are in each document
- The correct way to resolve it

${ISSUE_SCHEMA}`;

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
    const raw = await callModel(messages, REASONING_MODEL, { maxTokens: 4096 });
    const result = parseCoherenceResponse(raw);
    return result;
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
