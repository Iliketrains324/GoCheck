/**
 * AFORM Agent — Activity Approval Form
 * Uses vision (Qwen VL) because AFORM is always a fillable PDF with checkboxes.
 */

import { callVisionModel } from "@/lib/openrouter";
import type { AgentInput, AgentOutput } from "./types";
import { ISSUE_SCHEMA } from "./types";

const SYSTEM_PROMPT = `You are an expert document checker for De La Salle University Manila's
Council of Student Organizations (CSO). You are reviewing an Activity Approval Form (A-Form).

Your job is to identify ALL violations of the official checking guide. Here are the rules:

FIELD 1 — Requesting Organization
- Must be FULL name (not just acronym). E.g. "Council of Student Organizations" not "CSO"

FIELD 2 — Title of Activity
- Must be complete and consistent with what will appear throughout the pre-acts
- Note any potential inconsistencies (e.g. different title in AFORM vs visible elsewhere)

FIELD 3 — Nature of Activity
- The checked box MUST be under "CSO and Special Groups"
- WRONG if box under "USG" is checked

FIELD 4 — Type of Activity
- MUST be under "Through CSO and DAAM"
- If "Through SLIFE" is checked → flag as NO STATUS, process thru SLIFE
- Organizations may tick MORE THAN ONE box (must be aligned with GOSM)

FIELD 5 — Date of Activity
- Must be consistent with blanket of approval
- If date differs by more than +/- 7 days from blanket of approval: FA signature REQUIRED
- If activity is term-long: date must say "termlong" or "yearlong"
- Date must be consistent throughout all pre-acts

FIELD 6 — Time of Activity
- F2F events: must NOT exceed 9:00 PM (major pend if 9:01 PM or later)
- Online events: must NOT exceed 10:00 PM (major pend if 10:01 PM or later)
- Asynchronous or term-long activities: Time should be N/A

FIELD 7 — Venue of Activity
- Venue/link must be clearly readable
- If link is too long: "See PPR" or "See Link in PPR" is acceptable
- F2F venues optional for TL/YL activities

FIELD 8 — ENP/ENMP
- ENP (Expected Number of Participants) must be ≥ ENMP (Expected Number of Members Participating)
- Neither can be 0

FIELD 9 — Online Activity and Activity in GOSM
- F2F activity: must check "NO" for Online Activity
- Online synchronous: check "YES"
- Online asynchronous / pub posting: check "YES"
- Activity in GOSM: ALWAYS check "Yes" (unless SAS provided)

FIELD 10 — Reach of Activity
- ONLY ONE box must be ticked
- If more than one box is ticked: flag as issue
- If no box is ticked: flag as issue

FIELD 11 — Signatories
- "Submitted by" section: Name + signature + date/time must be VISIBLE
- Organization President: Name + signature + date/time must be VISIBLE
- Faculty Adviser (FA): Name is ALWAYS required; date/time is optional
- Missing any of these: flag as issue

${ISSUE_SCHEMA}`;

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
    const raw = await callVisionModel(SYSTEM_PROMPT, userPrompt, pages);
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
