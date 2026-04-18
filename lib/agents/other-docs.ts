/**
 * Skill agents for all non-AFORM, non-PPR, non-coherence documents.
 * All use text extraction + DeepSeek.
 */

import { callModel, TEXT_MODEL } from "@/lib/openrouter";
import type { AgentInput, AgentOutput, DocType } from "./types";
import { ISSUE_SCHEMA, WRITING_CHECKS } from "./types";

function parseAgentResponse(raw: string, docType: DocType): AgentOutput {
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
      issues: [{ field: "Parse Error", problem: "Could not parse response", suggestion: "Re-run check.", severity: "minor" }],
      summary: "Unable to parse results.",
    };
  }
}

async function runTextCheck(
  docType: DocType,
  systemPrompt: string,
  text: string,
  onToken?: (token: string) => void
): Promise<AgentOutput> {
  if (!text) {
    return { docType, status: "error", issues: [], summary: "No text extracted." };
  }
  try {
    const raw = await callModel(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Review this document and return the JSON result.\n\n---\n${text}\n---` },
      ],
      TEXT_MODEL,
      { onToken }
    );
    return parseAgentResponse(raw, docType);
  } catch (err) {
    return { docType, status: "error", issues: [], summary: `Error: ${(err as Error).message}` };
  }
}

// ─── LETTER OF INVITATION ─────────────────────────────────────────────────────

const LETTER_PROMPT = `You are checking a Letter of Invitation to Speakers for a DLSU CSO event.

RULES:
- Format must be BLOCK FORMAT (everything aligned to the left margin)
- Must include all required details: date, time, venue, contact details
- ALL speakers, mentors, judges, tutors must receive a letter
- Signatories must be complete — must include the name of Sir James (James Lontoc or the SLIFE Director)
- Sir James's signature is NOT needed if the speaker is a CURRENT member of the organization
  BUT his name must ALWAYS be in the signatory portion

WRONG EXAMPLES:
- Letter not in block format
- Missing signature of Sir James for a non-org-member speaker (MAJOR PEND)
- Missing date, time, venue, or contact details
- Number of letters ≠ number of speakers

WRITING QUALITY — This is a formal business letter. Flag:
- Incomplete or run-on sentences in the body
- Unprofessional or unclear phrasing that could confuse the recipient
- Salutation or closing that is missing or clearly wrong
- Wrong speaker name (different name in salutation vs. signatory block)

${WRITING_CHECKS}
${ISSUE_SCHEMA}`;

export async function checkLetterOfInvitation(input: AgentInput): Promise<AgentOutput> {
  return runTextCheck("LETTER_OF_INVITATION", LETTER_PROMPT, input.text ?? "", input.onToken);
}

// ─── CREDENTIALS OF SPEAKERS ─────────────────────────────────────────────────

const CREDENTIALS_PROMPT = `You are checking Credentials of Speakers for a DLSU CSO event.

SPEAKER CLASSIFICATION (higher distinction takes precedence):

VIP:
- Elected government official, ambassadors, executive officers of public companies
- International expats, people who ran for national posts
- Local and international celebrities (actors, singers, models)

DISTINGUISHED SPEAKER:
- Non-elected government official, local professionals (doctors, lawyers, professors, nurses, architects, dentists, etc.)
- International artists, people who ran for local posts
- Authors, professionals with certifications/degree courses
- NOTE: DLSU professor with ADDITIONAL VIP/Distinguished credentials → process thru SLIFE

NON-DISTINGUISHED SPEAKER:
- DLSU alumnus, current DLSU students, DLSU employees/professors (no VIP/Distinguished extras)
- Local student artists, experts in their fields
- Internet personalities: vloggers, TikTokers, influencers, content creators, pageant candidates

ROUTING RULE:
- VIP or Distinguished Speaker → process thru SLIFE (flag as major issue if submitted to APS)
- Non-Distinguished Speaker → can process thru APS

${WRITING_CHECKS}
${ISSUE_SCHEMA}`;

export async function checkCredentials(input: AgentInput): Promise<AgentOutput> {
  return runTextCheck("CREDENTIALS", CREDENTIALS_PROMPT, input.text ?? "", input.onToken);
}

// ─── VENUE RESERVATION TICKET ─────────────────────────────────────────────────

const VENUE_PROMPT = `You are checking a Venue Reservation Ticket (VRT) for a DLSU CSO event.

RULES — VRT is REQUIRED if ANY of the following apply:
1. Event time is MORE than 2 hours
2. Venue is a LARGE venue
3. A venue fee is indicated in Section V of the PPR
4. Reserved SJ, Velasco, or Miguel benches

VRT is NOT required for small or medium venues (unless >2 hours or fee is charged).
A "Pending" status on the VRT is acceptable.

CHECK:
- If the document has a VRT, verify it is present and attached
- If this document IS the VRT, verify it is complete and consistent with the activity details
- Flag if VRT is missing when it should be required
- Note: VRT does not need to be fully approved — pending status is acceptable

${WRITING_CHECKS}
${ISSUE_SCHEMA}`;

export async function checkVenueReservation(input: AgentInput): Promise<AgentOutput> {
  return runTextCheck("VENUE_RESERVATION", VENUE_PROMPT, input.text ?? "", input.onToken);
}

// ─── MEETING AGENDA ──────────────────────────────────────────────────────────

const MEETING_AGENDA_PROMPT = `You are checking a Meeting Agenda for a DLSU CSO event.

RULES:
- Activity Details within this document must be internally consistent
  (title, date, time, venue, nature of activity, type of activity must not contradict each other)
- Cross-document consistency (vs. A-Form or PPR) is handled separately — do not flag it here
- Signatories must be COMPLETE (all required positions must have signed)
- Required for all activities that include meetings

${WRITING_CHECKS}
${ISSUE_SCHEMA}`;

export async function checkMeetingAgenda(input: AgentInput): Promise<AgentOutput> {
  return runTextCheck("MEETING_AGENDA", MEETING_AGENDA_PROMPT, input.text ?? "", input.onToken);
}

// ─── RECRUITMENT/AUDITION MECHANICS ──────────────────────────────────────────

const RECRUITMENT_PROMPT = `You are checking Recruitment/Audition Mechanics for a DLSU CSO event.

RULES:
- Activity Details within this document must be internally consistent
- Cross-document consistency (vs. A-Form or PPR) is handled separately — do not flag it here
- Sections I through V must ALWAYS be filled out
- Section VI is OPTIONAL (depends on the activity)
- Required for all activities that include recruitment or auditions

${WRITING_CHECKS}
${ISSUE_SCHEMA}`;

export async function checkRecruitmentMechanics(input: AgentInput): Promise<AgentOutput> {
  return runTextCheck("RECRUITMENT_MECHANICS", RECRUITMENT_PROMPT, input.text ?? "", input.onToken);
}

// ─── LIST OF QUESTIONS ────────────────────────────────────────────────────────

const QUESTIONS_PROMPT = `You are checking a List of Questions for a DLSU CSO recruitment activity.

RULES:
- Required if the type of activity is RECRUITMENT
- Required regardless of whether recruitment is synchronous (with interviews) or asynchronous (Google Forms only)
- Must be placed RIGHT AFTER the Recruitment Mechanics in the pre-acts package
- Verify the list contains actual interview/application questions

${WRITING_CHECKS}
${ISSUE_SCHEMA}`;

export async function checkListOfQuestions(input: AgentInput): Promise<AgentOutput> {
  return runTextCheck("LIST_OF_QUESTIONS", QUESTIONS_PROMPT, input.text ?? "", input.onToken);
}

// ─── ELECTION MECHANICS ───────────────────────────────────────────────────────

const ELECTION_PROMPT = `You are checking Election Mechanics for a DLSU CSO election activity.

RULES:
- Activity Details within this document must be internally consistent
- Cross-document consistency (vs. A-Form or PPR) is handled separately — do not flag it here
- Sections I through V must ALWAYS be filled out
- Section VI (Miting de Avance section) can be OMITTED if NO Miting de Avance will be conducted
- Required for all activities that include elections

${WRITING_CHECKS}
${ISSUE_SCHEMA}`;

export async function checkElectionMechanics(input: AgentInput): Promise<AgentOutput> {
  return runTextCheck("ELECTION_MECHANICS", ELECTION_PROMPT, input.text ?? "", input.onToken);
}

// ─── GENERAL CONTEST MECHANICS ────────────────────────────────────────────────

const GENERAL_CONTEST_PROMPT = `You are checking General Contest Mechanics for a DLSU CSO contest activity.

RULES:
- Activity Details within this document must be internally consistent
- Cross-document consistency (vs. A-Form or PPR) is handled separately — do not flag it here
- Prize Details must include: price per quantity of each prize
- Position listed under Affiliation must NOT be "Project Head"
- If prizes come from X-deals (sponsors, in-kind), a note must appear below the prize table

${WRITING_CHECKS}
${ISSUE_SCHEMA}`;

export async function checkGeneralContestMechanics(input: AgentInput): Promise<AgentOutput> {
  return runTextCheck("GENERAL_CONTEST_MECHANICS", GENERAL_CONTEST_PROMPT, input.text ?? "", input.onToken);
}

// ─── ACADEMIC CONTEST MECHANICS ───────────────────────────────────────────────

const ACADEMIC_CONTEST_PROMPT = `You are checking Academic Contest Mechanics for a DLSU CSO academic contest activity.

RULES (same as General Contest Mechanics PLUS):
- Activity Details within this document must be internally consistent
- Cross-document consistency (vs. A-Form or PPR) is handled separately — do not flag it here
- Prize Details must include: price per quantity
- Position under Affiliation must NOT be "Project Head"
- If prizes are X-deals: note must be below the table
- ADDITIONAL REQUIREMENT: Signatory of the Department Chair is REQUIRED

${WRITING_CHECKS}
${ISSUE_SCHEMA}`;

export async function checkAcademicContestMechanics(input: AgentInput): Promise<AgentOutput> {
  return runTextCheck("ACADEMIC_CONTEST_MECHANICS", ACADEMIC_CONTEST_PROMPT, input.text ?? "", input.onToken);
}

// ─── SAMPLE PUB ───────────────────────────────────────────────────────────────

const SAMPLE_PUB_PROMPT = `You are checking a Sample Publication (pub) for a DLSU CSO activity.

RULES:
- REQUIRED for activities whose TYPE OF ACTIVITY is "Awareness Campaign"
- The publication must be attached and clearly readable
- Must include the following required elements: name of the activity/event, date, time, venue
- Must include the organization name
- Social media links or registration links (if applicable) should be visible
- The design/content should not contain any inappropriate content
- Branding must represent the organization appropriately

${WRITING_CHECKS}
${ISSUE_SCHEMA}`;

export async function checkSamplePub(input: AgentInput): Promise<AgentOutput> {
  return runTextCheck("SAMPLE_PUB", SAMPLE_PUB_PROMPT, input.text ?? "", input.onToken);
}

// ─── PRE-REGISTRATION FORM ────────────────────────────────────────────────────

const PREREG_PROMPT = `You are checking a Pre-registration Form with Data Privacy for a DLSU CSO event.

RULES:
- REQUIRED for: Case Competitions, Seminar/Workshop, Webinars, and Donation Drive activities
- Form must include a Data Privacy Notice/Consent clause
- Required fields must be appropriate for the type of activity
- If collecting personal data, data privacy compliance text must be present
- Form title/header should match the activity name
- Must be consistent with what is indicated in the PPR venue section
- Google Forms: Screenshot must be attached in the pre-acts

${WRITING_CHECKS}
${ISSUE_SCHEMA}`;

export async function checkPreRegistrationForm(input: AgentInput): Promise<AgentOutput> {
  return runTextCheck("PRE_REGISTRATION_FORM", PREREG_PROMPT, input.text ?? "", input.onToken);
}
