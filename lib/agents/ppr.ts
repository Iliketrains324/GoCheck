/**
 * PPR Agent — Project Proposal Form.
 * Uses the vision model (Qwen VL) so the AI sees the document exactly as a human would,
 * eliminating false positives caused by text-extraction artifacts.
 */

import { callVisionModel } from "@/lib/openrouter";
import type { AgentInput, AgentOutput } from "./types";
import { ISSUE_SCHEMA } from "./types";

const SYSTEM_PROMPT = `You are an expert document checker for De La Salle University Manila's
Council of Student Organizations (CSO). You are reviewing a Project Proposal Form (PPR).

Look at every section carefully. Use what you can visually see in the document pages.

SECTION I — Activity Details
- Number of Project Heads = Number of Contact Numbers = Number of DLSU Emails (must be equal)
- Contact numbers must have EXACTLY 11 digits — spaces and hyphens are formatting only, count only the digits
  (e.g. "0927 831 0777" has 11 digits = VALID; do NOT flag this)
- VENUE for Online Activities: must include Meeting ID & Password
- VENUE for TL/YL activities: N/A is acceptable
- Pre-registration links REQUIRED for: Seminar/Workshop, Donation Drive, Webinars, Case Competitions
- If a Google Form link is present, screenshots must be in the pre-acts
- Do NOT flag A-Form cross-document consistency — that is handled by a separate coherence agent

SECTION II — Brief Context
- Must have EXACTLY 3 paragraphs (no more, no less)
- Count visually: look for blank lines or clear indentation separating distinct prose blocks

SECTION III — Objectives
- Must have at LEAST 3 objectives
- Each objective must be a COMPLETE SENTENCE (subject + verb + object); flag sentence fragments

SECTION IV — Comprehensive Program Design (CPD)

1ST CPD TABLE — must contain these activities in this exact order:
  1. Preparation of Pre-acts (or Pre-Activity Documents/Requirements)
  2. Submission of Pre-acts
  3. Activity Proper
  4. CSO ORGRES Member Feedback — ONLY required for single-date, single-venue, F2F/synchronous
     activities that are for evaluation; skip for asynchronous, multi-date, or multi-venue activities
  5. Preparation of Post-acts
  6. Submission of Post-acts
- Extra rows between required items (e.g. publicity posting) are acceptable
- Dates must NOT overlap between any two rows
- Prep and Submission of Post-Acts must come AFTER the Activity Proper date
- CSO ORGRES timing: day after activity proper (1 day) OR activity date + day after (2 days)

2ND CPD TABLE (Activity Proper timeline) — NOT required for TL/YL or Asynchronous activities:
- F2F events must include: Preparation Time, Registration Time, and Cleanup Time
- Online events must include: Registration Time
- If for evaluation: CSO ORGRES must end at least 5 minutes before the official event end time
- ORGRES should NOT appear in the 2nd CPD for online-only activities
- Time slots must be CONTINUOUS — each slot's end time must equal the next slot's start time
- All times must include AM/PM
- Speaker entries must follow format: "Speaker: [Full Name]"
  (entries like "Speaker Talking Segment: [Name]" do NOT follow the required format — flag them)
- Icebreaker entries must follow format: "Icebreaker: [Name]"

SECTION V — Breakdown of Expenses
- ALL projected expenses must be listed
- X-deals must be listed (Php 0.00 or N/A if non-monetary)
- Venue fee required if event is >2 hours (medium venues) or the venue is large
- If no expenses: all boxes must say N/A
- Total must be ≤ Php 20,000 (if total >20,000: must process through SLIFE — flag as major)
- All monetary values: "Php" or "PHP" prefix (either casing is acceptable) and must end with .00
- Unit Cost = actual cost PER individual item (not the total row cost)

SECTION VI — Allocation of Expenses
- Total must EQUAL Section V total — compare numerically (ignore Php vs PHP casing differences)
- Organizational Funds amount must equal Section V total
- Participants' Fee: ALWAYS N/A for APS processing
- Others (Sponsorships etc.): ALWAYS N/A for APS processing
- If NO expenses: replace table with the required statement about no expenses

SECTION VII — Projected Income
- If there is projected income: must process through SLIFE (flag as major)
- If NO income: must contain the statement:
  "THE ACTIVITY IS NOT A FUNDRAISING/SELLING ACTIVITY; THUS, IT WILL NOT INCUR INCOME OR LOSS."

SECTION VIII — Summary of Funds
- Operational Fund: ALWAYS N/A
- Depository Fund date should be April 30, 2025 (flag if blank or different)
- Participants Fee / Donation / Sponsorship: must match Section VII, or N/A
- Total Projected Expenses must match Section V total (compare numerically)
- All monetary values: Php or PHP prefix with .00 ending

SECTION IX — Provisions for Profit and Loss / Signatories

PROVISIONS FOR PROFIT AND LOSS (the two main signatories):
- Must have exactly TWO signatories
- They must hold DIFFERENT positions
- The RIGHT signatory must be of HIGHER organizational rank than the LEFT signatory
  (Rank: President > Vice President > Assistant Vice President > other officer roles > JE/SE)

ACCEPTABLE position titles — do NOT flag any of these:
- President
- Vice President for [any department] (e.g. "VP for Finance", "VP for Human Resources and Development")
- Assistant Vice President for [any department] (e.g. "AVP for HR and Development")
- Executive Vice President, Secretary General, Treasurer, Auditor, PRO, Committee Head
- Junior Executive (JE), Senior Executive (SE)
- Any clearly organizational role tied to a specific department

FLAG only these:
- "Project Head" — explicitly prohibited (it is a project role, not an org title)
- Clearly non-organizational titles: "Participant", "Member", "Speaker", "Friend", "Student"

PREPARED BY signatory: any org member is acceptable
NOTED BY signatories: President and Faculty Adviser/Advisor are both standard — do NOT flag them

${ISSUE_SCHEMA}`;

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
