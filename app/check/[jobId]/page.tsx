"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { DOC_TYPE_LABELS } from "@/lib/supabase";
import type { Job, ProgressEntry, DocType } from "@/lib/supabase";

const STATUS_LABELS: Record<string, string> = {
  pending: "Waiting...",
  uploading: "Uploading files...",
  processing: "Checking documents...",
  completed: "All done!",
  failed: "Failed",
};

async function runProcessing(jobId: string, files: Job["files"]) {
  const docTypes = (files ?? []).map((f) => f.docType);
  const hasCoherence = docTypes.length > 1;

  for (let i = 0; i < docTypes.length; i++) {
    const isLast = !hasCoherence && i === docTypes.length - 1;
    await fetch(`/api/jobs/${jobId}/process-doc`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ docType: docTypes[i], isLast }),
    });
  }

  if (hasCoherence) {
    await fetch(`/api/jobs/${jobId}/process-doc`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ docType: "COHERENCE", isLast: true }),
    });
  }
}

export default function CheckPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingStarted, setProcessingStarted] = useState(false);

  useEffect(() => {
    fetch(`/api/jobs/${jobId}`)
      .then((r) => r.json())
      .then((data: Job) => {
        setJob(data);
        setLoading(false);
        if (data.status === "completed") {
          setTimeout(() => router.push(`/results/${jobId}`), 1200);
        } else if (data.status === "pending" && !processingStarted) {
          // Check page owns processing — fires once, survives the page lifecycle
          setProcessingStarted(true);
          runProcessing(jobId, data.files);
        }
      });

    const channel = supabase
      .channel(`job:${jobId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "jobs", filter: `id=eq.${jobId}` },
        (payload) => {
          const updated = payload.new as Job;
          setJob(updated);
          if (updated.status === "completed") {
            setTimeout(() => router.push(`/results/${jobId}`), 1200);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [jobId, router]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <span className="material-symbols-outlined text-primary animate-spin text-5xl">progress_activity</span>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="bg-surface-container-lowest rounded-xl p-8 text-center max-w-sm">
          <span className="material-symbols-outlined text-error text-5xl mb-3 block">error</span>
          <p className="font-headline font-semibold text-primary">Job not found</p>
          <Link href="/upload" className="btn-primary mt-6 inline-flex">Start Over</Link>
        </div>
      </div>
    );
  }

  const progress: ProgressEntry[] = job.progress ?? [];
  const jobStatus = job.status;
  const files = job.files ?? [];
  const docStatuses = new Map(progress.map((p) => [p.docType, p]));
  const doneCount = progress.filter((p) => p.status === "done").length;
  const progressPct = Math.max(10, (doneCount / Math.max(files.length, 1)) * 100);

  return (
    <div className="bg-surface font-body text-on-surface flex h-screen overflow-hidden">
      {/* Slim sidebar */}
      <aside className="bg-slate-50 h-screen w-16 flex flex-col items-center py-6 space-y-8 sticky left-0 top-0 z-50 flex-shrink-0">
        <Link href="/" className="font-black text-primary text-xl tracking-tighter font-headline">G</Link>
        <nav className="flex flex-col space-y-4 flex-grow">
          <span className="text-primary bg-primary/10 rounded-lg p-2.5">
            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
          </span>
          <span className="text-on-surface-variant/40 p-2.5">
            <span className="material-symbols-outlined text-xl">folder_open</span>
          </span>
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-grow flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-slate-50/80 glass-nav flex justify-between items-center w-full px-8 py-4 flex-shrink-0">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-on-surface-variant hover:text-primary transition-all">
              <span className="material-symbols-outlined">arrow_back</span>
            </Link>
            <div>
              <h1 className="text-lg font-black tracking-tighter text-primary font-headline">
                GoCheck Audit Suite
              </h1>
              <p className="text-xs font-medium text-on-surface-variant uppercase tracking-widest">
                {STATUS_LABELS[jobStatus] ?? jobStatus}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {jobStatus !== "completed" && jobStatus !== "failed" && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-tertiary-container/10 rounded-full">
                <span className="flex h-2 w-2 rounded-full bg-on-tertiary-container animate-pulse" />
                <span className="text-xs font-semibold text-on-tertiary-container">Analysis Live</span>
              </div>
            )}
            {jobStatus === "completed" && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-tertiary-fixed rounded-full">
                <span className="material-symbols-outlined text-on-tertiary-fixed text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                <span className="text-xs font-bold text-on-tertiary-fixed">Complete</span>
              </div>
            )}
          </div>
        </header>

        {/* Split view */}
        <section className="flex-grow flex overflow-hidden">
          {/* Left: document list (document canvas) */}
          <div className="w-7/12 bg-surface-container-low p-8 overflow-y-auto no-scrollbar">
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Overall progress */}
              <div className="bg-surface-container-lowest rounded-xl p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0
                      ${jobStatus === "completed" ? "bg-tertiary-fixed" : jobStatus === "failed" ? "bg-error-container" : "bg-surface-container"}`}
                  >
                    {jobStatus === "completed" ? (
                      <span className="material-symbols-outlined text-on-tertiary-fixed text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    ) : jobStatus === "failed" ? (
                      <span className="material-symbols-outlined text-error text-2xl">error</span>
                    ) : (
                      <span className="material-symbols-outlined text-primary text-2xl animate-spin">progress_activity</span>
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-primary font-headline tracking-tighter">
                      {STATUS_LABELS[jobStatus] ?? jobStatus}
                    </h2>
                    <p className="text-on-surface-variant text-sm">
                      {jobStatus === "completed"
                        ? "Redirecting to results..."
                        : jobStatus === "failed"
                        ? job.error ?? "An error occurred."
                        : `Analyzing ${files.length} document${files.length > 1 ? "s" : ""}...`}
                    </p>
                  </div>
                </div>
                {jobStatus !== "completed" && jobStatus !== "failed" && (
                  <div className="bg-surface-container rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full bg-on-tertiary-container transition-all duration-500 animate-pulse-bar rounded-full"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Document rows */}
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Documents</p>
                {files.map((file) => {
                  const prog = docStatuses.get(file.docType);
                  const docStatus = prog?.status ?? "pending";
                  return (
                    <div key={file.docType} className="bg-surface-container-lowest rounded-xl p-5 flex items-center gap-4">
                      <div className="w-10 h-10 bg-surface-container rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-on-surface-variant text-base">description</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-headline font-semibold text-primary text-sm">
                          {DOC_TYPE_LABELS[file.docType as DocType] ?? file.docType}
                        </p>
                        <p className="text-xs text-on-surface-variant truncate">{file.fileName}</p>
                        {prog?.message && (
                          <p className="text-xs text-on-surface-variant mt-0.5 truncate">{prog.message}</p>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        {docStatus === "done" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed text-xs font-bold">
                            <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>check</span> Done
                          </span>
                        ) : docStatus === "error" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-error-container text-on-error-container text-xs font-bold">
                            Error
                          </span>
                        ) : docStatus === "processing" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-fixed text-primary text-xs font-bold">
                            <span className="material-symbols-outlined text-xs animate-spin">progress_activity</span> Checking
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant text-xs font-bold">
                            Queued
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Coherence row */}
                {files.length > 1 && (
                  <div className="bg-primary rounded-xl p-5 flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary-container rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-on-primary-container text-base">hub</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-headline font-semibold text-white text-sm">Cross-Document Coherence Check</p>
                      <p className="text-xs text-primary-fixed/70">Checks for inconsistencies between all documents</p>
                    </div>
                    <div className="flex-shrink-0">
                      {jobStatus === "completed" ? (
                        <span className="material-symbols-outlined text-primary-fixed" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      ) : (
                        <span className="material-symbols-outlined text-primary-fixed/50 animate-spin">progress_activity</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {jobStatus === "failed" && (
                <Link href="/upload" className="inline-flex items-center gap-2 border border-outline-variant text-primary px-6 py-3 rounded-xl font-headline font-bold hover:bg-surface-container transition-all text-sm mt-4">
                  <span className="material-symbols-outlined text-base">refresh</span>
                  Try Again
                </Link>
              )}
            </div>
          </div>

          {/* Right: AI agent panel */}
          <div className="w-5/12 bg-white flex flex-col overflow-hidden">
            <div className="p-8 space-y-6 flex-grow overflow-y-auto no-scrollbar">
              <div className="flex items-center justify-between">
                <h3 className="font-headline font-black text-xl text-primary tracking-tighter">
                  AI Auditor Intelligence
                </h3>
                <span className="text-xs font-bold px-2 py-1 bg-primary text-white rounded">ACTIVE</span>
              </div>

              {/* Agent activity cards */}
              <div className="space-y-3">
                {files.slice(0, 3).map((file, idx) => {
                  const prog = docStatuses.get(file.docType);
                  const st = prog?.status ?? "pending";
                  const label = DOC_TYPE_LABELS[file.docType as DocType] ?? file.docType;
                  return (
                    <div
                      key={file.docType}
                      className={`p-4 rounded-xl flex items-center gap-4 ${
                        st === "processing"
                          ? "bg-primary-container text-white"
                          : "bg-surface-container-low"
                      }`}
                    >
                      <div
                        className={`flex items-center justify-center h-10 w-10 rounded-lg flex-shrink-0 ${
                          st === "done"
                            ? "bg-on-tertiary-container"
                            : st === "processing"
                            ? "bg-on-primary-container"
                            : "bg-surface-container"
                        }`}
                      >
                        <span className={`material-symbols-outlined text-sm ${st === "done" || st === "processing" ? "text-white" : "text-on-surface-variant"}`}>
                          {st === "done" ? "check_circle" : st === "processing" ? "manage_search" : "description"}
                        </span>
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className={`text-sm font-bold truncate ${st === "processing" ? "text-white" : "text-primary"}`}>
                          Agent {idx + 1}: {label}
                        </p>
                        {st === "processing" && prog?.message && (
                          <p className="text-[10px] text-primary-fixed/70 truncate">{prog.message}</p>
                        )}
                        {st === "processing" && (
                          <div className={`w-full h-1 rounded-full mt-2 overflow-hidden ${st === "processing" ? "bg-primary" : "bg-surface-container-highest"}`}>
                            <div className="bg-on-primary-container h-full w-[60%] animate-pulse-bar" />
                          </div>
                        )}
                      </div>
                      {st === "done" && (
                        <span className="material-symbols-outlined text-on-tertiary-container flex-shrink-0">check_circle</span>
                      )}
                      {st === "processing" && (
                        <span className="h-4 w-4 border-2 border-primary-fixed border-t-transparent animate-spin rounded-full flex-shrink-0" />
                      )}
                    </div>
                  );
                })}
                {files.length > 1 && (
                  <div className="p-4 rounded-xl bg-surface-container-low flex items-center gap-4">
                    <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-secondary-container flex-shrink-0">
                      <span className="material-symbols-outlined text-on-secondary-container text-sm">hub</span>
                    </div>
                    <div className="flex-grow">
                      <p className="text-sm font-bold text-primary">Orchestrator: Cross-referencing...</p>
                      <p className="text-[10px] text-on-surface-variant">Matching against CSO Guidelines 2024</p>
                    </div>
                    {jobStatus !== "completed" && (
                      <span className="h-4 w-4 border-2 border-secondary-container border-t-transparent animate-spin rounded-full flex-shrink-0" />
                    )}
                    {jobStatus === "completed" && (
                      <span className="material-symbols-outlined text-on-tertiary-container text-base flex-shrink-0">check_circle</span>
                    )}
                  </div>
                )}
              </div>

              {/* Bento stats */}
              <div className="grid grid-cols-2 gap-3 mt-8">
                <div className="p-4 bg-surface-container rounded-xl">
                  <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-wider block">Docs Checked</span>
                  <p className="text-2xl font-headline font-black text-on-tertiary-container">
                    {doneCount}
                  </p>
                </div>
                <div className="p-4 bg-surface-container rounded-xl">
                  <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-wider block">Total</span>
                  <p className="text-2xl font-headline font-black text-primary">
                    {files.length}
                  </p>
                </div>
              </div>

              {/* Live Diagnostic Logs */}
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-on-surface-variant text-sm">terminal</span>
                  <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-wider">Diagnostic Logs</span>
                  {jobStatus !== "completed" && jobStatus !== "failed" && (
                    <span className="flex h-1.5 w-1.5 rounded-full bg-on-tertiary-container animate-pulse ml-auto" />
                  )}
                </div>
                <div className="bg-surface-container rounded-xl p-4 space-y-2 max-h-48 overflow-y-auto no-scrollbar font-label">
                  {/* Job status line */}
                  <div className="flex items-start gap-2">
                    <span className="text-on-surface-variant/40 text-[10px] font-mono mt-0.5 flex-shrink-0">SYS</span>
                    <span className="text-[11px] text-on-surface-variant">
                      Job <span className="font-mono text-primary">{jobId.slice(0, 8)}</span> — status: <span className="font-bold">{jobStatus}</span>
                    </span>
                  </div>
                  {/* Progress entries */}
                  {progress.map((p, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className={`text-[10px] font-mono mt-0.5 flex-shrink-0 ${
                        p.status === "error" ? "text-error" : p.status === "done" ? "text-on-tertiary-container" : "text-secondary"
                      }`}>
                        {p.status === "error" ? "ERR" : p.status === "done" ? "OK " : "RUN"}
                      </span>
                      <span className={`text-[11px] leading-relaxed ${
                        p.status === "error" ? "text-error" : "text-on-surface-variant"
                      }`}>
                        [{DOC_TYPE_LABELS[p.docType as DocType] ?? p.docType}] {p.message ?? p.status}
                      </span>
                    </div>
                  ))}
                  {progress.length === 0 && jobStatus === "pending" && (
                    <div className="flex items-start gap-2">
                      <span className="text-[10px] font-mono text-on-surface-variant/40 mt-0.5">SYS</span>
                      <span className="text-[11px] text-on-surface-variant/60">Waiting for AI agents to start...</span>
                    </div>
                  )}
                  {jobStatus === "failed" && job?.error && (
                    <div className="flex items-start gap-2">
                      <span className="text-[10px] font-mono text-error mt-0.5">ERR</span>
                      <span className="text-[11px] text-error">{job.error}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-surface-container-low flex-shrink-0">
              {jobStatus === "completed" ? (
                <Link
                  href={`/results/${jobId}`}
                  className="w-full py-4 premium-gradient text-white rounded-xl font-headline font-bold flex items-center justify-center gap-2 shadow-xl shadow-primary/20 hover:-translate-y-0.5 transition-all text-sm"
                >
                  <span className="material-symbols-outlined text-base">analytics</span>
                  View Results
                </Link>
              ) : (
                <div className="w-full py-4 bg-surface-container text-on-surface-variant rounded-xl font-headline font-bold flex items-center justify-center gap-2 text-sm">
                  <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                  Audit in Progress...
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
