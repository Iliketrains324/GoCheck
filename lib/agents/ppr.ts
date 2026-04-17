/**
 * PPR Agent — Project Proposal Form.
 * Split into 4 focused sub-agents run in parallel for higher accuracy.
 */

import { callModel, TEXT_MODEL } from "@/lib/openrouter";
import type { AgentInput, AgentOutput, IssueItem } from "./types";
import { ISSUE_SCHEMA } from "./types";

// ─── Shared helpers ────────────────────────────────────────────────────────────

function parseIssues(raw: string): IssueItem[] {
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return [];
    const parsed = JSON.parse(match[0]);
    return parsed.issues ?? [];
  } catch {
    return [];
  }
}

async function runSubAgent(systemPrompt: string, text: string): Promise<IssueItem[]> {
  const raw = await callModel(
    [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Review this PPR document and return only the JSON result for the sections you are responsible for.\n\n---\n${text}\n---`,
      },
    ],
    TEXT_MODEL
  );
  return parseIssues(raw);
}

// ─── Sub-agent 1: Activity Details, Brief Context, Objectives ─────────────────

const BASICS_PROMPT = `You are checking Sections I, II, and III of a PPR (Project Proposal Form) for a DLSU CSO event.
Only check these three sections. Ignore all other sections.

SECTION I — Activity Details
- Number of Project Heads, Contact Numbers, and DLSU Emails must be EQUAL
- Contact numbers must have EXACTLY 11 digits — count only digits, ignore spaces, hyphens, and formatting
  (e.g. "0927 831 0777" = 11 digits = VALID; do NOT flag this)
- VENUE for Online Activities: must include Meeting ID & Password
- VENUE for TL/YL activities: N/A is acceptable
- Pre-registration links REQUIRED for: Seminar/Workshop, Donation Drive, Webinars, Case Competitions
- If a Google Form link is present, screenshots must be included in the pre-acts
- Do NOT check A-Form or PPR cross-document consistency here — that is handled by a separate coherence agent

SECTION II — Brief Context
- Must have EXACTLY 3 paragraphs (no more, no less)
- Paragraphs are separated by blank lines in the extracted text
- Count clearly distinct blocks of prose text as paragraphs; do not count section headers or labels

SECTION III — Objectives
- Must have at LEAST 3 objectives
- Each objective must be a COMPLETE SENTENCE (subject + verb + object); flag sentence fragments

${ISSUE_SCHEMA}`;

// ─── Sub-agent 2: Comprehensive Program Design ────────────────────────────────

const CPD_PROMPT = `You are checking Section IV of a PPR (Project Proposal Form) for a DLSU CSO event.
Only check Section IV. Ignore all other sections.

SECTION IV — Comprehensive Program Design (CPD)

1ST CPD TABLE — Required activities in this exact order:
  1. Preparation of Pre-acts (or Pre-Activity Documents/Requirements)
  2. Submission of Pre-acts
  3. Activity Proper
  4. CSO ORGRES Member Feedback — ONLY required for: single-date, single-venue, F2F/synchronous activities that are for evaluation
  5. Preparation of Post-acts
  6. Submission of Post-acts
- Extra rows (e.g. publicity posting) between required items are acceptable
- Dates must NOT overlap between rows
- Prep and Submission of Post-Acts must be AFTER the Activity Proper date
- CSO ORGRES (if required): day after activity proper (1 day) OR activity date + day after (2 days)
- ORGRES NOT needed for: asynchronous, multiple-dated, or multiple-venue activities

2ND CPD TABLE (Activity Proper timeline) — NOT required for TL/YL or Asynchronous activities:
- F2F events must include: Preparation Time, Registration Time, Cleanup Time
- Online events must include: Registration Time
- If the activity is for evaluation: CSO ORGRES must appear and end at least 5 minutes before the official event end time
- ORGRES should NOT appear in the 2nd CPD for online-only activities
- Time slots must be CONTINUOUS — each slot's end time must equal the next slot's start time
  (e.g. 2:00 PM - 2:05 PM followed by 2:05 PM - 2:10 PM is correct)
- All times must include AM/PM
- Speaker entries must follow format: "Speaker: [Full Name]" (NOT "Speaker Talking Segment: ...")
- Icebreaker entries must follow format: "Icebreaker: [Name]"

${ISSUE_SCHEMA}`;

// ─── Sub-agent 3: Financial Sections ─────────────────────────────────────────

const FINANCIALS_PROMPT = `You are checking Sections V, VI, VII, and VIII of a PPR (Project Proposal Form) for a DLSU CSO event.
Only check these four sections. Ignore all other sections.

MONETARY FORMAT RULE: Both "Php" and "PHP" are acceptable prefixes (do NOT flag casing differences).
All monetary values must end with .00 (e.g. Php 500.00 or PHP 500.00 — both valid).

SECTION V — Breakdown of Expenses
- ALL projected expenses must be listed
- X-deals must be listed (use Php 0.00 or N/A if non-monetary)
- Venue fee required if event is >2 hours (medium venues) or the venue is large
- If no expenses: all boxes must say N/A
- Total must be ≤ Php 20,000 (if total >20,000: must process through SLIFE — flag as major)
- Unit Cost = actual cost PER item (not total)

SECTION VI — Allocation of Expenses
- Total must equal Section V total — compare NUMERICALLY (ignore Php vs PHP casing)
- Organizational Funds amount must equal Section V total
- Participants' Fee: ALWAYS N/A for APS processing
- Others (Sponsorships etc.): ALWAYS N/A for APS processing
- If NO expenses: replace table with the required text about no expenses needed

SECTION VII — Projected Income
- If there is projected income: must process through SLIFE (flag as major)
- If NO income: must contain the statement:
  "THE ACTIVITY IS NOT A FUNDRAISING/SELLING ACTIVITY; THUS, IT WILL NOT INCUR INCOME OR LOSS."

SECTION VIII — Summary of Funds
- Operational Fund: ALWAYS N/A
- Depository Fund date should be April 30, 2025 (flag if blank or different)
- Participants Fee / Donation / Sponsorship: must match Section VII, or N/A
- Total Projected Expenses must match Section V total (compare numerically)
- All monetary amounts: Php or PHP prefix with .00 ending

${ISSUE_SCHEMA}`;

// ─── Sub-agent 4: Signatories ─────────────────────────────────────────────────

const SIGNATORIES_PROMPT = `You are checking Section IX of a PPR (Project Proposal Form) for a DLSU CSO event.
Only check Section IX. Ignore all other sections.

SECTION IX — Provisions for Profit and Loss / Signatories

PROVISIONS FOR PROFIT AND LOSS (the two main signatories):
- Must have exactly TWO signatories
- They must hold DIFFERENT positions
- The RIGHT signatory must be of HIGHER organizational rank than the LEFT signatory
- Rank order (high to low): President > Vice President (VP) > Assistant Vice President (AVP) > other officer roles > Junior/Senior Executive

ACCEPTABLE position titles (non-exhaustive — use judgment for similar titles):
- President
- Vice President for [any department] (VP)
- Assistant Vice President for [any department] (AVP)
- Executive Vice President
- Secretary General, Treasurer, Auditor, Public Relations Officer (PRO)
- Committee Head, Project Manager
- Junior Executive (JE), Senior Executive (SE)
- Any clearly organizational role tied to a specific department

NOT ACCEPTABLE — flag these:
- "Project Head" — explicitly prohibited (it is a project role, not an org position)
- Generic non-roles: "Participant", "Member", "Speaker", "Friend", "Student"

PREPARED BY signatory:
- Any org member is acceptable; no specific title required

NOTED BY signatories:
- President is standard and acceptable
- Faculty Adviser / Faculty Advisor is standard and acceptable
- Do NOT flag these

DO NOT flag AVP, VP, President, Faculty Adviser, Junior Executive, Senior Executive, or any
department-specific VP/AVP title — these are all normal organizational positions.

${ISSUE_SCHEMA}`;

// ─── Public entry point ───────────────────────────────────────────────────────

export async function checkPpr(input: AgentInput): Promise<AgentOutput> {
  const { text } = input;
  if (!text) {
    return {
      docType: "PPR",
      status: "error",
      issues: [],
      summary: "No text extracted from PPR document.",
    };
  }

  const [basicsIssues, cpdIssues, financialsIssues, signatoryIssues] =
    await Promise.all([
      runSubAgent(BASICS_PROMPT, text),
      runSubAgent(CPD_PROMPT, text),
      runSubAgent(FINANCIALS_PROMPT, text),
      runSubAgent(SIGNATORIES_PROMPT, text),
    ]);

  const allIssues: IssueItem[] = [
    ...basicsIssues,
    ...cpdIssues,
    ...financialsIssues,
    ...signatoryIssues,
  ];

  const status = allIssues.length > 0 ? "has_issues" : "ok";
  return {
    docType: "PPR",
    status,
    issues: allIssues,
    summary:
      status === "ok"
        ? "PPR check complete — no issues found."
        : `Found ${allIssues.length} issue(s) across the PPR.`,
  };
}
