/**
 * Orchestrator — coordinates all skill agents for a job.
 * Called from the /api/jobs/[jobId]/process route.
 */

import { getServiceClient } from "@/lib/supabase";
// PDF extraction now happens client-side; this orchestrator is superseded by runAllAgents in check/[jobId]/page.tsx
import { checkAform } from "./aform";
import { checkPpr } from "./ppr";
import { checkCoherence } from "./coherence";
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
} from "./other-docs";
import type { DocType, DocResult, JobFile } from "@/lib/supabase";
import type { AgentOutput } from "./types";

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

export async function runOrchestrator(jobId: string): Promise<void> {
  const db = getServiceClient();

  async function updateProgress(docType: DocType, status: string, message?: string) {
    const { data: job } = await db.from("jobs").select("progress").eq("id", jobId).single();
    const progress = (job?.progress ?? []) as Array<{
      docType: string;
      status: string;
      message?: string;
      timestamp: string;
    }>;
    const existing = progress.findIndex((p) => p.docType === docType);
    const entry = { docType, status, message, timestamp: new Date().toISOString() };
    if (existing >= 0) progress[existing] = entry;
    else progress.push(entry);
    await db.from("jobs").update({ progress, updated_at: new Date().toISOString() }).eq("id", jobId);
  }

  async function setJobStatus(
    status: string,
    results?: Record<string, DocResult>,
    error?: string
  ) {
    await db
      .from("jobs")
      .update({
        status,
        results: results ?? null,
        error: error ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);
  }

  try {
    // Fetch job
    const { data: job, error: jobErr } = await db
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (jobErr || !job) {
      throw new Error(`Job not found: ${jobErr?.message}`);
    }

    const files: JobFile[] = job.files ?? [];
    const results: Record<string, DocResult> = {};

    await setJobStatus("processing");

    // Process each document with its skill agent
    for (const file of files) {
      const { docType, storagePath, pages } = file;
      const agentFn = AGENT_MAP[docType];

      if (!agentFn) {
        await updateProgress(docType, "error", `No agent available for ${docType}`);
        results[docType] = {
          docType,
          status: "error",
          issues: [],
          summary: `No agent for ${docType}`,
        };
        continue;
      }

      await updateProgress(docType, "processing", `Checking ${docType}...`);

      let text: string | undefined;

      // Download file from Supabase Storage for text extraction (non-AFORM)
      if (docType !== "AFORM") {
        const { data: fileData, error: dlErr } = await db.storage
          .from("documents")
          .download(storagePath);

        if (dlErr || !fileData) {
          await updateProgress(docType, "error", `Failed to download: ${dlErr?.message}`);
          results[docType] = {
            docType,
            status: "error",
            issues: [],
            summary: `Could not download file for ${docType}`,
          };
          continue;
        }

        const buffer = Buffer.from(await fileData.arrayBuffer());
        text = buffer.toString("utf-8"); // fallback — orchestrator is superseded by client-side runAllAgents
      }

      const output = await agentFn({ docType, text, pages: pages ?? [] });

      results[docType] = {
        ...output,
        rawText: text?.slice(0, 3000),
      };

      await updateProgress(docType, "done", output.summary);
    }

    // Run coherence check if multiple documents submitted
    if (Object.keys(results).length > 1) {
      await updateProgress("AFORM" as DocType, "processing", "Running cross-document coherence check...");

      const coherenceResult = await checkCoherence({
        docType: "AFORM",
        allResults: results,
      });

      results["COHERENCE"] = {
        ...coherenceResult,
        docType: "AFORM",
      };

      await updateProgress("AFORM" as DocType, "done", coherenceResult.summary);
    }

    await setJobStatus("completed", results);
  } catch (err) {
    const message = (err as Error).message;
    await setJobStatus("failed", undefined, message);
    throw err;
  }
}
