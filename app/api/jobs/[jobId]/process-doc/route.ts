/**
 * POST /api/jobs/[jobId]/process-doc
 * Processes a SINGLE document for a job.
 * Body JSON: { docType: string, isLast?: boolean }
 */

// Allow up to 60 s on Vercel Hobby (default is 10 s — not enough for DeepSeek)
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { extractTextFromBuffer } from "@/lib/pdf";
import { checkAform } from "@/lib/agents/aform";
import { checkPpr } from "@/lib/agents/ppr";
import {
  checkLetterOfInvitation,
  checkCredentials,
  checkVenueReservation,
  checkMeetingAgenda,
  checkRecruitmentMechanics,
  checkListOfQuestions,
  checkElectionMechanics,
  checkGeneralContestMechanics,
  checkAcademicContestMechanics,
  checkSamplePub,
  checkPreRegistrationForm,
} from "@/lib/agents/other-docs";
import { checkCoherence } from "@/lib/agents/coherence";
import type { DocType, DocResult, JobFile } from "@/lib/supabase";
import type { AgentOutput } from "@/lib/agents/types";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const ALLOWED_DOC_TYPES = new Set([
  "AFORM", "PPR", "LETTER_OF_INVITATION", "CREDENTIALS", "VENUE_RESERVATION",
  "MEETING_AGENDA", "RECRUITMENT_MECHANICS", "LIST_OF_QUESTIONS", "ELECTION_MECHANICS",
  "GENERAL_CONTEST_MECHANICS", "ACADEMIC_CONTEST_MECHANICS", "SAMPLE_PUB",
  "PRE_REGISTRATION_FORM", "COHERENCE",
]);

type AgentFn = (input: { docType: DocType; text?: string; pages?: string[] }) => Promise<AgentOutput>;

const AGENT_MAP: Partial<Record<DocType, AgentFn>> = {
  AFORM: checkAform,
  PPR: checkPpr,
  LETTER_OF_INVITATION: checkLetterOfInvitation,
  CREDENTIALS: checkCredentials,
  VENUE_RESERVATION: checkVenueReservation,
  MEETING_AGENDA: checkMeetingAgenda,
  RECRUITMENT_MECHANICS: checkRecruitmentMechanics,
  LIST_OF_QUESTIONS: checkListOfQuestions,
  ELECTION_MECHANICS: checkElectionMechanics,
  GENERAL_CONTEST_MECHANICS: checkGeneralContestMechanics,
  ACADEMIC_CONTEST_MECHANICS: checkAcademicContestMechanics,
  SAMPLE_PUB: checkSamplePub,
  PRE_REGISTRATION_FORM: checkPreRegistrationForm,
};

export async function POST(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const { jobId } = params;

  if (!UUID_RE.test(jobId)) {
    return NextResponse.json({ error: "Invalid job ID" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const { docType, isLast } = body as { docType?: string; isLast?: boolean };

  if (!docType || !ALLOWED_DOC_TYPES.has(docType)) {
    return NextResponse.json({ error: "Invalid docType" }, { status: 400 });
  }

  const db = getServiceClient();

  // Fetch job
  const { data: job, error: jobErr } = await db
    .from("jobs")
    .select("*")
    .eq("id", jobId)
    .single();

  if (jobErr || !job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const files: JobFile[] = job.files ?? [];
  const existingResults: Record<string, DocResult> = job.results ?? {};

  // ── Helper: update progress array ────────────────────────────────────────

  async function updateProgress(dt: string, status: string, message?: string) {
    const { data: fresh } = await db.from("jobs").select("progress").eq("id", jobId).single();
    const progress = (fresh?.progress ?? []) as Array<{ docType: string; status: string; message?: string; timestamp: string }>;
    const idx = progress.findIndex((p) => p.docType === dt);
    const entry = { docType: dt, status, message, timestamp: new Date().toISOString() };
    if (idx >= 0) progress[idx] = entry; else progress.push(entry);
    await db.from("jobs").update({ progress, updated_at: new Date().toISOString() }).eq("id", jobId);
  }

  // ── COHERENCE special case ────────────────────────────────────────────────

  if (docType === "COHERENCE") {
    if (Object.keys(existingResults).length < 2) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    await updateProgress("COHERENCE", "processing", "Running cross-document coherence check...");

    const coherenceResult = await checkCoherence({
      docType: "AFORM" as DocType,
      allResults: existingResults,
    });

    const newResults = {
      ...existingResults,
      COHERENCE: { ...coherenceResult, docType: "AFORM" as DocType },
    };

    const { error: cohWriteErr } = await db.from("jobs").update({
      results: newResults,
      status: "completed",
      updated_at: new Date().toISOString(),
    }).eq("id", jobId);

    if (cohWriteErr) {
      console.error("[process-doc] COHERENCE DB write failed:", cohWriteErr.message);
      return NextResponse.json({ error: "DB write failed", detail: cohWriteErr.message }, { status: 500 });
    }

    await updateProgress("COHERENCE", "done", coherenceResult.summary);

    return NextResponse.json({ ok: true, docType: "COHERENCE" });
  }

  // ── Per-document processing ───────────────────────────────────────────────

  const file = files.find((f) => f.docType === docType);
  if (!file) {
    return NextResponse.json({ error: `No file found for docType ${docType}` }, { status: 404 });
  }

  const agentFn = AGENT_MAP[docType as DocType];
  if (!agentFn) {
    return NextResponse.json({ error: `No agent for ${docType}` }, { status: 400 });
  }

  await updateProgress(docType, "processing", `Checking ${docType}...`);
  // Mark job as processing on first doc
  if (job.status === "pending") {
    await db.from("jobs").update({ status: "processing" }).eq("id", jobId);
  }

  let text: string | undefined;

  if (docType !== "AFORM") {
    const { data: fileData, error: dlErr } = await db.storage
      .from("documents")
      .download(file.storagePath);

    if (dlErr || !fileData) {
      await updateProgress(docType, "error", `Failed to download file.`);
      return NextResponse.json({ error: "Failed to download file" }, { status: 500 });
    }

    const buffer = Buffer.from(await fileData.arrayBuffer());
    text = await extractTextFromBuffer(buffer);
  }

  const output = await agentFn({ docType: docType as DocType, text, pages: file.pages ?? [] });

  const newResults = {
    ...existingResults,
    [docType]: { ...output, rawText: text?.slice(0, 3000) },
  };

  const { error: writeErr } = await db.from("jobs").update({
    results: newResults,
    status: isLast ? "completed" : "processing",
    updated_at: new Date().toISOString(),
  }).eq("id", jobId);

  if (writeErr) {
    console.error("[process-doc] DB write failed:", writeErr.message);
    return NextResponse.json({ error: "DB write failed", detail: writeErr.message }, { status: 500 });
  }

  await updateProgress(docType, "done", output.summary);

  return NextResponse.json({ ok: true, docType, status: output.status });
}
