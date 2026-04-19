"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { DOC_TYPE_LABELS } from "@/lib/supabase";
import type { Job, ProgressEntry, DocType, DocResult } from "@/lib/supabase";
import { checkAform } from "@/lib/agents/aform";
import { checkPpr } from "@/lib/agents/ppr";
import { checkCoherence } from "@/lib/agents/coherence";
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
import type { AgentInput, AgentOutput } from "@/lib/agents/types";
import { Logo, StepCrumbs } from "@/app/components/logo";
import { Check, ChevronDown, ChevronUp } from "@/app/components/icons";

const AGENT_MAP: Partial<Record<DocType, (input: AgentInput) => Promise<AgentOutput>>> = {
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

async function patchJob(jobId: string, update: Record<string, unknown>) {
  await fetch(`/api/jobs/${jobId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(update),
  }).catch((err) => console.error("[patchJob]", err));
}

function CheckRow({
  label,
  file,
  status,
  isLast,
  accent,
}: {
  label: string;
  file: string;
  status: "done" | "running" | "queued";
  isLast: boolean;
  accent?: boolean;
}) {
  const colors = {
    done:    { mark: "var(--accent)",    text: "var(--ink)",      note: "Done" },
    running: { mark: "var(--ink)",       text: "var(--ink)",      note: "Checking…" },
    queued:  { mark: "var(--ink-mute)", text: "var(--ink-mute)", note: "Queued" },
  }[status];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "28px 1fr auto",
        gap: 16, alignItems: "center",
        padding: "18px 22px",
        borderBottom: isLast ? "none" : "1px solid var(--hairline)",
        background: accent && status === "running" ? "var(--container-low)" : "transparent",
      }}
    >
      <span style={{ display: "inline-flex", justifyContent: "center" }}>
        {status === "done" && <Check size={16} stroke={2.4} style={{ color: colors.mark }} />}
        {status === "running" && (
          <span
            style={{
              width: 14, height: 14, borderRadius: "50%",
              border: "1.5px solid var(--ink)",
              borderTopColor: "transparent",
              animation: "spin 0.9s linear infinite",
              display: "inline-block",
            }}
          />
        )}
        {status === "queued" && (
          <span
            style={{
              width: 7, height: 7, borderRadius: "50%",
              background: "var(--hairline-strong)",
              display: "inline-block",
            }}
          />
        )}
      </span>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontFamily: "Inter, system-ui, sans-serif",
            fontWeight: 500, fontSize: 14.5,
            color: colors.text, letterSpacing: "-0.005em",
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: 12.5, color: "var(--ink-mute)",
            marginTop: 2, overflow: "hidden",
            textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}
        >
          {file}
        </div>
      </div>
      <span
        style={{
          fontFamily: "ui-monospace, Menlo, monospace",
          fontSize: 11, color: colors.mark,
          textTransform: "lowercase", letterSpacing: "0.02em",
        }}
      >
        {colors.note}
      </span>
    </div>
  );
}

export default function CheckPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLog, setShowLog] = useState(false);
  const processingStarted = useRef(false);
  const [streamContent, setStreamContent] = useState("");
  const [streamDocLabel, setStreamDocLabel] = useState("");
  const streamBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/jobs/${jobId}`, { cache: "no-store" })
      .then((r) => r.json())
      .then(async (data: Job) => {
        setJob(data);
        setLoading(false);

        if (data.status === "completed") {
          setTimeout(() => router.push(`/results/${jobId}`), 800);
          return;
        }

        if (data.status === "pending" && !processingStarted.current) {
          processingStarted.current = true;
          try {
            await runAllAgents(
              jobId,
              data,
              setJob,
              (token) => setStreamContent((prev) => prev + token),
              (label) => { setStreamContent(""); setStreamDocLabel(label); }
            );
          } catch (err) {
            console.error("[CheckPage] processing failed:", err);
          }
          router.push(`/results/${jobId}`);
        }
      })
      .catch((err) => {
        console.error("[CheckPage] fetch error:", err);
        setLoading(false);
      });
  }, [jobId, router]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (streamBoxRef.current) {
      streamBoxRef.current.scrollTop = streamBoxRef.current.scrollHeight;
    }
  }, [streamContent]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--paper)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span
          style={{
            width: 32, height: 32, borderRadius: "50%",
            border: "2px solid var(--accent)", borderTopColor: "transparent",
            animation: "spin 0.8s linear infinite",
            display: "inline-block",
          }}
        />
      </div>
    );
  }

  if (!job) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--paper)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            border: "1px solid var(--hairline)", borderRadius: 14,
            padding: "36px 40px", textAlign: "center", maxWidth: 360,
          }}
        >
          <p style={{ fontFamily: "Manrope, system-ui, sans-serif", fontWeight: 600, fontSize: 18, color: "var(--ink)", marginBottom: 16 }}>
            Job not found
          </p>
          <Link
            href="/upload"
            style={{
              background: "var(--ink)", color: "var(--paper)",
              padding: "12px 20px", borderRadius: 999,
              fontFamily: "Inter, system-ui, sans-serif", fontWeight: 600, fontSize: 14,
              textDecoration: "none", display: "inline-flex", alignItems: "center",
            }}
          >
            Start over
          </Link>
        </div>
      </div>
    );
  }

  const progress: ProgressEntry[] = job.progress ?? [];
  const jobStatus = job.status;
  const files = job.files ?? [];
  const docStatuses = new Map(progress.map((p) => [p.docType, p]));
  const doneCount = progress.filter((p) => p.status === "done").length;
  const hasCoherence = files.length > 1;
  const totalSteps = files.length + (hasCoherence ? 1 : 0);
  const progressPct = Math.max(6, (doneCount / Math.max(totalSteps, 1)) * 100);
  const complete = jobStatus === "completed";

  return (
    <div style={{ background: "var(--paper)", minHeight: "100vh", color: "var(--ink)" }}>
      {/* Nav */}
      <header
        style={{
          position: "sticky", top: 0, zIndex: 40,
          background: "rgba(250,250,248,0.88)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          borderBottom: "1px solid var(--hairline)",
        }}
      >
        <div
          style={{
            maxWidth: 1200, margin: "0 auto",
            padding: "18px 36px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <Link href="/" style={{ textDecoration: "none" }}>
              <Logo />
            </Link>
            <StepCrumbs step={2} />
          </div>
          {/* Live / Finished pill */}
          <span
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "4px 10px", borderRadius: 999,
              background: complete ? "var(--accent-soft)" : "var(--accent-soft)",
              color: "var(--accent-ink)",
              fontFamily: "Inter, system-ui, sans-serif",
              fontWeight: 600, fontSize: 11.5,
              letterSpacing: "-0.005em",
            }}
          >
            <span
              style={{
                width: 6, height: 6, borderRadius: "50%",
                background: "var(--accent)",
                animation: complete ? "none" : "pulse-dot 1.4s ease-in-out infinite",
                display: "inline-block",
              }}
            />
            {complete ? "Finished" : "Live"}
          </span>
        </div>
      </header>

      <main style={{ maxWidth: 880, margin: "0 auto", padding: "56px 36px 80px" }}>
        {/* Heading */}
        <div
          style={{
            display: "flex", alignItems: "flex-start",
            justifyContent: "space-between", gap: 24, marginBottom: 36,
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: "Manrope, system-ui, sans-serif",
                fontWeight: 700, fontSize: 40,
                letterSpacing: "-0.03em", lineHeight: 1.05,
                color: "var(--ink)", margin: 0, marginBottom: 10,
              }}
            >
              {complete ? "Audit complete." : "Auditing your documents…"}
            </h1>
            <p style={{ fontFamily: "Inter, system-ui, sans-serif", fontSize: 15, color: "var(--ink-mute)", margin: 0 }}>
              {complete
                ? "Taking you to results."
                : `${doneCount} of ${totalSteps} checks complete · safe to refresh`}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div
          style={{
            height: 3, background: "var(--container)",
            borderRadius: 999, overflow: "hidden", marginBottom: 40,
          }}
        >
          <div
            style={{
              height: "100%", width: `${progressPct}%`,
              background: "var(--accent)",
              transition: "width 600ms cubic-bezier(.2,.8,.2,1)",
            }}
          />
        </div>

        {/* Check ledger */}
        <div
          style={{
            border: "1px solid var(--hairline)",
            borderRadius: 12, background: "var(--paper)",
            overflow: "hidden", marginBottom: 24,
          }}
        >
          {files.map((file, i) => {
            const prog = docStatuses.get(file.docType);
            const ds = prog?.status ?? "pending";
            const isLastFile = !hasCoherence && i === files.length - 1;
            return (
              <CheckRow
                key={file.docType}
                label={DOC_TYPE_LABELS[file.docType as DocType] ?? file.docType}
                file={file.fileName}
                status={ds === "done" ? "done" : ds === "processing" ? "running" : "queued"}
                isLast={isLastFile}
              />
            );
          })}
          {hasCoherence && (
            <CheckRow
              label="Cross-document coherence"
              file="Verifies dates, venue, and titles match"
              status={
                docStatuses.get("COHERENCE" as DocType)?.status === "done"
                  ? "done"
                  : complete
                  ? "done"
                  : doneCount >= files.length
                  ? "running"
                  : "queued"
              }
              isLast
              accent
            />
          )}
        </div>

        {/* Log toggle */}
        <div>
          <button
            onClick={() => setShowLog((s) => !s)}
            style={{
              background: "transparent", border: "none",
              display: "inline-flex", alignItems: "center", gap: 6,
              color: "var(--ink-mute)",
              fontFamily: "Inter, system-ui, sans-serif",
              fontSize: 13, fontWeight: 500,
              cursor: "pointer", padding: "6px 0",
            }}
          >
            {showLog ? <ChevronUp size={14} stroke={2} /> : <ChevronDown size={14} stroke={2} />}
            {showLog ? "Hide" : "Show"} live agent output
            {streamDocLabel && !showLog && (
              <span style={{ color: "var(--accent-ink)", fontSize: 12, marginLeft: 4 }}>
                · {streamDocLabel}
              </span>
            )}
          </button>

          {showLog && (
            <div
              ref={streamBoxRef}
              style={{
                marginTop: 8,
                background: "#0e1614",
                borderRadius: 12, padding: "16px 20px",
                fontFamily: "ui-monospace, Menlo, monospace",
                fontSize: 12, lineHeight: 1.65,
                color: "#c6d3cd", maxHeight: 220, overflow: "auto",
              }}
            >
              {streamContent ? (
                <span style={{ color: "#86efac", whiteSpace: "pre-wrap" }}>
                  {streamContent}
                  {!complete && (
                    <span style={{ display: "inline-block", marginLeft: 2, animation: "pulse-dot 1s ease-in-out infinite" }}>_</span>
                  )}
                </span>
              ) : (
                <span style={{ color: "rgba(198,211,205,0.4)" }}>
                  {jobStatus === "pending" ? "Waiting for agents…" : "Initializing…"}
                </span>
              )}
            </div>
          )}
        </div>

        {jobStatus === "failed" && (
          <Link
            href="/upload"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              marginTop: 32,
              border: "1px solid var(--hairline)",
              color: "var(--ink)", padding: "12px 18px",
              borderRadius: 999,
              fontFamily: "Inter, system-ui, sans-serif", fontWeight: 600, fontSize: 14,
              textDecoration: "none",
            }}
          >
            Try again
          </Link>
        )}
      </main>
    </div>
  );
}

// ─── Client-side agent runner ─────────────────────────────────────────────────

async function runAllAgents(
  jobId: string,
  initialJob: Job,
  setJob: (job: Job) => void,
  onStreamToken: (token: string) => void,
  onStreamDocChange: (label: string) => void
) {
  const files = initialJob.files ?? [];
  const hasCoherence = files.length > 1;
  const results: Record<string, DocResult> = {};
  let progress: ProgressEntry[] = [...(initialJob.progress ?? [])];

  function updateJobState(patch: Partial<Job>) {
    const next = { ...initialJob, progress: [...progress], results: results as Job["results"], ...patch };
    setJob(next);
  }

  async function markProgress(docType: string, status: ProgressEntry["status"], message?: string) {
    const entry: ProgressEntry = {
      docType: docType as DocType,
      status,
      message,
      timestamp: new Date().toISOString(),
    };
    const idx = progress.findIndex((p) => p.docType === docType);
    if (idx >= 0) progress[idx] = entry; else progress.push(entry);
    updateJobState({});
    patchJob(jobId, { progress }).catch(() => {});
  }

  await patchJob(jobId, { status: "processing" });
  updateJobState({ status: "processing" });

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const docType = file.docType as DocType;
    const agentFn = AGENT_MAP[docType];

    await markProgress(docType, "processing", `Checking ${docType}...`);
    onStreamDocChange(DOC_TYPE_LABELS[docType] ?? docType);

    let output: AgentOutput;
    try {
      if (!agentFn) throw new Error(`No agent for ${docType}`);
      output = await agentFn({
        docType,
        text: file.text,
        pages: file.pages ?? [],
        onToken: onStreamToken,
      });
    } catch (err) {
      output = {
        docType,
        status: "error",
        issues: [],
        summary: `Error: ${(err as Error).message}`,
      };
    }

    results[docType] = { ...output, rawText: file.text?.slice(0, 3000) };
    await markProgress(docType, "done", output.summary);

    const isLast = !hasCoherence && i === files.length - 1;
    await patchJob(jobId, {
      results,
      status: isLast ? "completed" : "processing",
    });
    if (isLast) updateJobState({ status: "completed" });
  }

  if (hasCoherence) {
    await markProgress("COHERENCE", "processing", "Running cross-document coherence check...");
    onStreamDocChange("Cross-Document Coherence Check");

    let coherenceOutput: AgentOutput;
    try {
      coherenceOutput = await checkCoherence({
        docType: "AFORM",
        allResults: results,
        onToken: onStreamToken,
      });
    } catch (err) {
      coherenceOutput = {
        docType: "AFORM",
        status: "error",
        issues: [],
        summary: `Coherence error: ${(err as Error).message}`,
      };
    }

    results["COHERENCE"] = { ...coherenceOutput, docType: "AFORM" };
    await markProgress("COHERENCE", "done", coherenceOutput.summary);
    await patchJob(jobId, { results, status: "completed" });
    updateJobState({ status: "completed" });
  }
}
