import { createClient } from "@supabase/supabase-js";

// Lazy singleton — avoids crashing during Next.js build when env vars aren't set
let _anonClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (!_anonClient) {
    _anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return _anonClient;
}

// Keep named export for client-side convenience (used in check/results pages)
export const supabase = {
  channel: (name: string) => getSupabaseClient().channel(name),
  removeChannel: (ch: ReturnType<ReturnType<typeof createClient>["channel"]>) =>
    getSupabaseClient().removeChannel(ch),
  from: (table: string) => getSupabaseClient().from(table),
};

export function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export type JobStatus =
  | "pending"
  | "uploading"
  | "processing"
  | "completed"
  | "failed";

export interface JobFile {
  docType: DocType;
  fileName: string;
  storagePath: string;
  /** base64-encoded page images, only populated for AFORM */
  pages?: string[];
}

export interface ProgressEntry {
  docType: DocType;
  status: "pending" | "processing" | "done" | "error";
  message?: string;
  timestamp: string;
}

export interface IssueItem {
  field: string;
  problem: string;
  suggestion: string;
  severity: "major" | "minor";
}

export interface DocResult {
  docType: DocType;
  status: "ok" | "has_issues" | "error";
  issues: IssueItem[];
  summary: string;
  rawText?: string;
}

export interface Job {
  id: string;
  status: JobStatus;
  created_at: string;
  updated_at: string;
  files: JobFile[];
  results: Record<string, DocResult> | null;
  progress: ProgressEntry[];
  error: string | null;
}

export type DocType =
  | "AFORM"
  | "PPR"
  | "LETTER_OF_INVITATION"
  | "CREDENTIALS"
  | "VENUE_RESERVATION"
  | "MEETING_AGENDA"
  | "RECRUITMENT_MECHANICS"
  | "LIST_OF_QUESTIONS"
  | "ELECTION_MECHANICS"
  | "GENERAL_CONTEST_MECHANICS"
  | "ACADEMIC_CONTEST_MECHANICS"
  | "SAMPLE_PUB"
  | "PRE_REGISTRATION_FORM";

export const DOC_TYPE_LABELS: Record<DocType, string> = {
  AFORM: "Activity Approval Form (A-Form)",
  PPR: "Project Proposal Form (PPR)",
  LETTER_OF_INVITATION: "Letter of Invitation to Speakers",
  CREDENTIALS: "Credentials of Speakers",
  VENUE_RESERVATION: "Venue Reservation Ticket",
  MEETING_AGENDA: "Meeting Agenda",
  RECRUITMENT_MECHANICS: "Recruitment/Audition Mechanics",
  LIST_OF_QUESTIONS: "List of Questions",
  ELECTION_MECHANICS: "Election Mechanics",
  GENERAL_CONTEST_MECHANICS: "General Contest Mechanics",
  ACADEMIC_CONTEST_MECHANICS: "Academic Contest Mechanics",
  SAMPLE_PUB: "Sample Publication",
  PRE_REGISTRATION_FORM: "Pre-registration Form with Data Privacy",
};
