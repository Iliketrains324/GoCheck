/**
 * PPR Agent — Project Proposal Form
 * Uses text extraction (DeepSeek).
 */

import { callModel, TEXT_MODEL } from "@/lib/openrouter";
import type { AgentInput, AgentOutput } from "./types";
import { ISSUE_SCHEMA } from "./types";

const SYSTEM_PROMPT = `You are an expert document checker for De La Salle University Manila's
Council of Student Organizations (CSO). You are reviewing a Project Proposal Form (PPR).

SECTION I — Activity Details
- Title, Nature of Activity, Type of Activity, Date, ENMP/ENP must be CONSISTENT with the A-Form
- Number of Project Heads = Number of Contact Numbers = Number of DLSU Emails
- Contact numbers must have EXACTLY 11 digits
- VENUE for Online Activities: must include Meeting ID & Password
- VENUE for TL/YL activities: N/A (optional to put venue)
- Registration/Pub posting links should be included if possible
- Pre-registration links are REQUIRED for: Seminar/Workshop, Donation Drive, Webinars, Case Competitions
- If Google Form links are included, attach screenshots in the pre-acts

SECTION II — Brief Context
- Must have EXACTLY 3 paragraphs (no more, no less)

SECTION III — Objectives
- Must have at LEAST 3 objectives
- Must be written in COMPLETE SENTENCES (not sentence fragments)

SECTION IV — Comprehensive Program Design (CPD)
1ST CPD TABLE — Required sequence (in this exact order):
  1. Preparation of Pre-acts
  2. Submission of Pre-acts
  3. Activity Proper
  4. ORGRES Member Feedback (only for single-date, single-venue, F2F/synchronous activities that are for evaluation)
  5. Preparation of Post-acts
  6. Submission of Post-acts
- Dates must NOT overlap
- Prep and Submission of Post-Acts must be AFTER Activity Proper
- CSO ORGRES: day after activity proper (1 day) OR activity date + day after (2 days)
- ORGRES NOT needed for: asynchronous, multiple-dated, multiple-venue activities

2ND CPD TABLE (Activity Proper Table) — NOT required for TL/YL or Asynchronous:
- F2F required: Preparation Time, Registration Time, Cleanup Time
- Online required: Registration Time
- If for evaluation: CSO ORGRES must be at least 5 minutes before event ends
- ORGRES should NOT be in 2nd CPD for online activities
- Time must be continuous (e.g. 10:00-10:05 AM; 10:05-10:10 AM)
- Must include AM/PM
- Speaker/Icebreaker must follow format: "Speaker: [Name]" or "Icebreaker: [Name]"

SECTION V — Breakdown of Expenses
- ALL projected expenses must be indicated
- X-deals must be listed (put PHP 0.00 or N/A if non-monetary)
- Venue fee is required if event is >2 hours (medium venues) or venue is large
- If no expenses: all boxes must say N/A
- Total must be ≤ PHP 20,000 (if >20,001: process thru SLIFE)
- All monetary values must have PHP prefix and end with .00
- Unit Cost = actual cost PER item

SECTION VI — Allocation of Expenses
- Total must EQUAL Section V total
- Source: Organization Funds (match Section V total)
- Participants' Fee: ALWAYS N/A for APS processing
- Others: ALWAYS N/A for APS processing
- Proper PHP formatting required
- If NO expenses: replace table with "THE ACTIVITY WILL NOT INCUR ANY EXPENSES; THUS, IT WILL NOT NEED FUNDING."

SECTION VII — Projected Income
- Activities with projected income = process thru SLIFE
- If NO income: replace table with "THE ACTIVITY IS NOT A FUNDRAISING/SELLING ACTIVITY; THUS, IT WILL NOT INCUR INCOME OR LOSS."

SECTION VIII — Summary of Funds
- Operational Fund: ALWAYS N/A
- Depository Fund date should be April 30, 2025 (check with treasurer for updates)
- Participants Fee/Donation/Sponsorships: consistent with Section VII or N/A
- Total Projected Expenses must match Section V
- All fields: PHP prefix and .00 ending

SECTION IX — Provisions for Profit and Loss / Signatories
- Must have TWO DIFFERENT positions (not same position)
- Right signatory must be of HIGHER ranking
- "Project Head" as position is NOT ALLOWED
- When signing for someone else: name & position must be indicated
- FA signature may not be needed if blanket of approval is provided, but name must still be included

${ISSUE_SCHEMA}`;

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

  const messages = [
    { role: "system" as const, content: SYSTEM_PROMPT },
    {
      role: "user" as const,
      content: `Please review this Project Proposal Form (PPR) text and identify all violations.\n\n---\n${text}\n---\n\nReturn the JSON result.`,
    },
  ];

  try {
    const raw = await callModel(messages, TEXT_MODEL);
    return parseAgentResponse(raw, "PPR");
  } catch (err) {
    return {
      docType: "PPR",
      status: "error",
      issues: [],
      summary: `Error during PPR check: ${(err as Error).message}`,
    };
  }
}

function parseAgentResponse(raw: string, docType: AgentInput["docType"]): AgentOutput {
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found");
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
      issues: [{ field: "Parse Error", problem: "Could not parse AI response", suggestion: "Re-run check.", severity: "minor" }],
      summary: "Unable to parse results.",
    };
  }
}
