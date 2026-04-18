import { callModel, TEXT_MODEL } from "@/lib/openrouter";
import type { AgentInput, AgentOutput, DocType } from "./types";
import { loadSkill } from "@/lib/skills/load";
import { parseAgentOutput } from "./parse";


async function runTextCheck(
  docType: DocType,
  skillName: string,
  text: string,
  onToken?: (token: string) => void
): Promise<AgentOutput> {
  if (!text) {
    return { docType, status: "error", issues: [], summary: "No text extracted." };
  }
  const systemPrompt = loadSkill(skillName);
  try {
    const raw = await callModel(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Review this document and return the JSON result.\n\n---\n${text}\n---` },
      ],
      TEXT_MODEL,
      { onToken }
    );
    return parseAgentOutput(raw, docType);
  } catch (err) {
    return { docType, status: "error", issues: [], summary: `Error: ${(err as Error).message}` };
  }
}

export async function checkLetterOfInvitation(input: AgentInput): Promise<AgentOutput> {
  return runTextCheck("LETTER_OF_INVITATION", "letter-of-invitation", input.text ?? "", input.onToken);
}

export async function checkCredentials(input: AgentInput): Promise<AgentOutput> {
  return runTextCheck("CREDENTIALS", "credentials", input.text ?? "", input.onToken);
}

export async function checkVenueReservation(input: AgentInput): Promise<AgentOutput> {
  return runTextCheck("VENUE_RESERVATION", "venue-reservation", input.text ?? "", input.onToken);
}

export async function checkMeetingAgenda(input: AgentInput): Promise<AgentOutput> {
  return runTextCheck("MEETING_AGENDA", "meeting-agenda", input.text ?? "", input.onToken);
}

export async function checkRecruitmentMechanics(input: AgentInput): Promise<AgentOutput> {
  return runTextCheck("RECRUITMENT_MECHANICS", "recruitment-mechanics", input.text ?? "", input.onToken);
}

export async function checkListOfQuestions(input: AgentInput): Promise<AgentOutput> {
  return runTextCheck("LIST_OF_QUESTIONS", "list-of-questions", input.text ?? "", input.onToken);
}

export async function checkElectionMechanics(input: AgentInput): Promise<AgentOutput> {
  return runTextCheck("ELECTION_MECHANICS", "election-mechanics", input.text ?? "", input.onToken);
}

export async function checkGeneralContestMechanics(input: AgentInput): Promise<AgentOutput> {
  return runTextCheck("GENERAL_CONTEST_MECHANICS", "general-contest-mechanics", input.text ?? "", input.onToken);
}

export async function checkAcademicContestMechanics(input: AgentInput): Promise<AgentOutput> {
  return runTextCheck("ACADEMIC_CONTEST_MECHANICS", "academic-contest-mechanics", input.text ?? "", input.onToken);
}

export async function checkSamplePub(input: AgentInput): Promise<AgentOutput> {
  return runTextCheck("SAMPLE_PUB", "sample-pub", input.text ?? "", input.onToken);
}

export async function checkPreRegistrationForm(input: AgentInput): Promise<AgentOutput> {
  return runTextCheck("PRE_REGISTRATION_FORM", "pre-registration-form", input.text ?? "", input.onToken);
}
