"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { Job, DocResult, DocType, IssueItem } from "@/lib/supabase";
import { DOC_TYPE_LABELS } from "@/lib/supabase";

function IssueRow({ issue }: { issue: IssueItem }) {
  return (
    <div className="flex items-start gap-5 p-5 rounded-xl bg-surface-container-low hover:-translate-y-[2px] hover:shadow-md transition-all">
      <span
        className={`material-symbols-outlined pt-0.5 text-xl flex-shrink-0 ${
          issue.severity === "major" ? "text-secondary" : "text-on-surface-variant"
        }`}
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        {issue.severity === "major" ? "warning" : "info"}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={issue.severity === "major" ? "badge-major" : "badge-minor"}>
            {issue.severity === "major" ? "Major" : "Minor"}
          </span>
          <p className="font-headline font-bold text-primary text-sm">{issue.field}</p>
        </div>
        <p className="text-on-surface-variant text-sm leading-relaxed">{issue.problem}</p>
        {issue.suggestion && (
          <p className="text-on-tertiary-container text-sm mt-2 font-medium">
            Fix: {issue.suggestion}
          </p>
        )}
      </div>
    </div>
  );
}

function DocResultCard({
  docType,
  result,
  isCoherence,
}: {
  docType: string;
  result: DocResult;
  isCoherence?: boolean;
}) {
  const [open, setOpen] = useState(result.status === "has_issues");
  const label = isCoherence
    ? "Cross-Document Coherence Check"
    : DOC_TYPE_LABELS[docType as DocType] ?? docType;

  return (
    <div className="bg-surface-container-lowest rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center gap-4 p-6 text-left hover:bg-surface-container-low transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex-shrink-0">
          {result.status === "ok" ? (
            <span className="material-symbols-outlined text-on-tertiary-container text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          ) : result.status === "error" ? (
            <span className="material-symbols-outlined text-error text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
          ) : (
            <span className="material-symbols-outlined text-secondary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {isCoherence && <span className="material-symbols-outlined text-on-surface-variant text-sm">hub</span>}
            <span className="font-headline font-bold text-primary text-sm">{label}</span>
          </div>
          <p className="text-xs text-on-surface-variant mt-0.5 truncate">{result.summary}</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {result.issues.length > 0 && (
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full ${
                result.issues.some((i) => i.severity === "major")
                  ? "bg-secondary-fixed text-secondary"
                  : "bg-surface-container text-on-surface-variant"
              }`}
            >
              {result.issues.length} issue{result.issues.length > 1 ? "s" : ""}
            </span>
          )}
          <span className="material-symbols-outlined text-on-surface-variant text-base">
            {open ? "expand_less" : "expand_more"}
          </span>
        </div>
      </button>

      {open && (
        <div className="px-6 pb-6 space-y-3 bg-surface-container-lowest">
          {result.issues.length === 0 ? (
            <div className="flex items-center gap-3 p-4">
              <span className="material-symbols-outlined text-on-tertiary-container">check_circle</span>
              <p className="text-sm text-on-tertiary-container font-semibold">No issues found</p>
            </div>
          ) : (
            result.issues.map((issue, i) => <IssueRow key={i} issue={issue} />)
          )}
        </div>
      )}
    </div>
  );
}

export default function ResultsPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const deadline = Date.now() + 180_000; // poll for up to 3 min

    async function poll() {
      while (!cancelled && Date.now() < deadline) {
        const res = await fetch(`/api/jobs/${jobId}`, { cache: "no-store" });
        const data: Job = await res.json();

        if (data.results) {
          if (!cancelled) { setJob(data); setLoading(false); }
          return;
        }

        // No results yet — wait 2 s then try again
        await new Promise((r) => setTimeout(r, 2000));
      }

      // Deadline hit or cancelled — show whatever we have
      if (!cancelled) {
        const res = await fetch(`/api/jobs/${jobId}`, { cache: "no-store" });
        const data: Job = await res.json();
        setJob(data);
        setLoading(false);
      }
    }

    poll();
    return () => { cancelled = true; };
  }, [jobId]);

  const handleDownload = () => {
    if (!job?.results) return;
    const lines: string[] = [];
    lines.push("GOCHECK — CSO DOCUMENT CORRECTIONS CHECKLIST");
    lines.push(`Job ID: ${jobId}`);
    lines.push(`Date: ${new Date().toLocaleString("en-PH")}`);
    lines.push("=".repeat(60));
    lines.push("");

    const results = job.results as Record<string, DocResult>;
    const total = Object.values(results).reduce((s, r) => s + r.issues.length, 0);
    const majors = Object.values(results).reduce(
      (s, r) => s + r.issues.filter((i) => i.severity === "major").length,
      0
    );
    lines.push(`SUMMARY: ${total} total issue(s) found — ${majors} major, ${total - majors} minor`);
    lines.push("");

    for (const [key, result] of Object.entries(results)) {
      const label =
        key === "COHERENCE"
          ? "Cross-Document Coherence"
          : (DOC_TYPE_LABELS[key as DocType] ?? key);
      lines.push(`=== ${label.toUpperCase()} ===`);
      lines.push(
        `Status: ${result.status === "ok" ? "PASSED" : result.status === "has_issues" ? "HAS ISSUES" : "ERROR"}`
      );
      lines.push(`Summary: ${result.summary}`);
      if (result.issues.length > 0) {
        lines.push("");
        result.issues.forEach((issue, i) => {
          lines.push(`  [${issue.severity.toUpperCase()}] Issue ${i + 1}`);
          lines.push(`  Field: ${issue.field}`);
          lines.push(`  Problem: ${issue.problem}`);
          lines.push(`  Fix: ${issue.suggestion}`);
          lines.push("");
        });
      } else {
        lines.push("  No issues found.");
        lines.push("");
      }
    }

    lines.push("─".repeat(60));
    lines.push("Generated by GoCheck · gocheck.vercel.app");

    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `GoCheck_Results_${jobId.slice(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <span className="material-symbols-outlined text-primary animate-spin text-5xl">progress_activity</span>
      </div>
    );
  }

  if (!job?.results) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="bg-surface-container-lowest rounded-xl p-8 text-center max-w-sm">
          <span className="material-symbols-outlined text-error text-5xl mb-3 block">error</span>
          <p className="font-headline font-semibold text-primary mb-4">Results not available yet.</p>
          <Link href={`/check/${jobId}`} className="premium-gradient text-white px-6 py-3 rounded-xl font-headline font-bold inline-flex items-center gap-2 text-sm">
            Back to Progress
          </Link>
        </div>
      </div>
    );
  }

  const results = job.results as Record<string, DocResult>;
  const docKeys = Object.keys(results).filter((k) => k !== "COHERENCE");
  const coherenceResult = results["COHERENCE"];
  const totalIssues = Object.values(results).reduce((s, r) => s + r.issues.length, 0);
  const majorIssues = Object.values(results).reduce(
    (s, r) => s + r.issues.filter((i) => i.severity === "major").length,
    0
  );
  const allOk = totalIssues === 0;
  const complianceScore = Math.max(
    0,
    Math.round(100 - majorIssues * 10 - (totalIssues - majorIssues) * 3)
  );

  return (
    <div className="bg-surface font-body text-on-surface min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="bg-slate-50/80 glass-nav sticky top-0 z-50 flex justify-between items-center w-full px-8 py-4 shadow-sm">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-2xl font-black tracking-tighter font-headline bg-gradient-to-r from-emerald-900 to-emerald-700 bg-clip-text text-transparent">
            GoCheck
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleDownload}
            className="text-primary font-headline font-bold text-sm flex items-center gap-2 hover:opacity-70 transition-opacity"
          >
            <span className="material-symbols-outlined text-base">download</span>
            Download
          </button>
        </div>
      </nav>

      <div className="flex-1 px-8 py-16 md:px-16 lg:px-24">
        {/* Celebratory hero */}
        <div className="max-w-4xl mx-auto text-center space-y-8 mb-20">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-tertiary-fixed text-on-tertiary-fixed rounded-full text-xs font-bold uppercase tracking-widest">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              {allOk ? "All Clear" : "Review Required"}
            </div>
            <h1 className="font-headline text-5xl md:text-7xl font-extrabold tracking-tighter text-primary">
              Audit Complete!
            </h1>
            <p className="text-on-surface-variant text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              {allOk
                ? "No issues detected. Your documents look good — ready for submission."
                : `Apply these ${totalIssues} correction${totalIssues > 1 ? "s" : ""} before submitting to CSO.`}
            </p>
          </div>

          {/* CTA cluster */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleDownload}
              className="premium-gradient text-white px-10 py-4 rounded-xl font-headline font-bold flex items-center gap-3 shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined">picture_as_pdf</span>
              Download Corrections Checklist
            </button>
            <Link
              href="/upload"
              className="border border-outline-variant/30 text-primary px-10 py-4 rounded-xl font-headline font-bold flex items-center gap-3 hover:bg-surface-container transition-all"
            >
              <span className="material-symbols-outlined">add</span>
              Start New Audit
            </Link>
          </div>
        </div>

        {/* Bento grid */}
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <h2 className="font-headline text-3xl font-bold text-primary tracking-tight">Executive Summary</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {/* Checklist card */}
            <div className="md:col-span-2 lg:col-span-3 bg-surface-container-lowest rounded-2xl p-10 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-headline text-2xl font-bold text-primary">Correction Checklist</h3>
                {totalIssues > 0 ? (
                  <span className="text-sm font-semibold text-secondary px-4 py-1.5 bg-secondary-fixed rounded-full">
                    {majorIssues} Critical · {totalIssues - majorIssues} Advisory
                  </span>
                ) : (
                  <span className="text-sm font-semibold text-on-tertiary-container px-4 py-1.5 bg-tertiary-fixed rounded-full">
                    All Clear
                  </span>
                )}
              </div>

              <div className="space-y-3">
                {docKeys.map((key) => (
                  <DocResultCard key={key} docType={key} result={results[key]} />
                ))}
                {coherenceResult && (
                  <DocResultCard docType="COHERENCE" result={coherenceResult} isCoherence />
                )}
              </div>
            </div>

            {/* Stats stack */}
            <div className="flex flex-col gap-8">
              {/* Score card */}
              <div className="bg-primary text-white rounded-2xl p-8 flex flex-col justify-between flex-1">
                <div>
                  <span className="material-symbols-outlined text-4xl mb-4 block text-primary-fixed" style={{ fontVariationSettings: "'FILL' 1" }}>analytics</span>
                  <h3 className="font-headline text-base font-bold opacity-80">Audit Score</h3>
                </div>
                <div>
                  <div className="text-6xl font-black font-headline tracking-tighter">
                    {complianceScore}%
                  </div>
                  <p className="text-xs text-on-primary-container font-medium mt-2 uppercase tracking-widest">
                    Compliance Rating
                  </p>
                </div>
              </div>

              {/* Issues card */}
              <div className="bg-secondary-container rounded-2xl p-8 flex flex-col justify-between">
                <span className="material-symbols-outlined text-4xl mb-4 block text-on-secondary-container" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {allOk ? "verified" : "warning"}
                </span>
                <div>
                  <div className="text-4xl font-black font-headline leading-none text-on-secondary-container">
                    {totalIssues}
                  </div>
                  <p className="text-xs font-bold mt-2 uppercase tracking-widest leading-tight text-on-secondary-container">
                    {allOk ? "Issues Found" : "Total Issues"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-auto px-8 py-12 flex flex-col md:flex-row justify-between items-center bg-surface-container-low">
        <div className="flex items-center gap-6 mb-6 md:mb-0">
          <span className="text-lg font-black text-primary opacity-40 tracking-tighter font-headline">GoCheck AI</span>
          <p className="text-xs text-on-surface-variant/60">© 2024 De La Salle University — Council of Student Organizations.</p>
        </div>
        <div className="flex items-center gap-8">
          <span className="text-xs font-bold text-on-surface-variant hover:text-primary uppercase tracking-widest transition-colors cursor-pointer">Privacy Policy</span>
          <span className="text-xs font-bold text-on-surface-variant hover:text-primary uppercase tracking-widest transition-colors cursor-pointer">Guidelines</span>
        </div>
      </footer>
    </div>
  );
}
