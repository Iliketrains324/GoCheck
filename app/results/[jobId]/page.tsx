"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Download,
  FileText,
  ChevronDown,
  ChevronUp,
  Link2,
} from "lucide-react";
import type { Job, DocResult, DocType, IssueItem } from "@/lib/supabase";
import { DOC_TYPE_LABELS } from "@/lib/supabase";

function IssueRow({ issue }: { issue: IssueItem }) {
  return (
    <div className="flex gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
      <span className={issue.severity === "major" ? "badge-major" : "badge-minor"}>
        {issue.severity === "major" ? "Major" : "Minor"}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-700">{issue.field}</p>
        <p className="text-sm text-gray-500 mt-0.5">{issue.problem}</p>
        {issue.suggestion && (
          <p className="text-sm text-dlsu-green mt-1">
            <span className="font-medium">Fix: </span>{issue.suggestion}
          </p>
        )}
      </div>
    </div>
  );
}

function DocResultCard({ docType, result, isCoherence }: { docType: string; result: DocResult; isCoherence?: boolean }) {
  const [open, setOpen] = useState(result.status === "has_issues");
  const label = isCoherence
    ? "Cross-Document Coherence Check"
    : DOC_TYPE_LABELS[docType as DocType] ?? docType;

  return (
    <div className={`card overflow-hidden ${result.status === "has_issues" ? "border-orange-200" : result.status === "error" ? "border-red-200" : "border-green-200"}`}>
      <button
        className="w-full flex items-center gap-3 p-4 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex-shrink-0">
          {result.status === "ok" ? (
            <CheckCircle className="text-green-500" size={20} />
          ) : result.status === "error" ? (
            <AlertCircle className="text-red-500" size={20} />
          ) : (
            <AlertTriangle className="text-orange-500" size={20} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {isCoherence && <Link2 size={14} className="text-dlsu-green" />}
            <span className="font-semibold text-gray-800 text-sm">{label}</span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5 truncate">{result.summary}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {result.issues.length > 0 && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              result.issues.some((i) => i.severity === "major")
                ? "bg-red-100 text-red-700"
                : "bg-yellow-100 text-yellow-700"
            }`}>
              {result.issues.length} issue{result.issues.length > 1 ? "s" : ""}
            </span>
          )}
          {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-2 border-t border-gray-100 pt-3">
          {result.issues.length === 0 ? (
            <p className="text-sm text-green-600 font-medium">✓ No issues found</p>
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
    fetch(`/api/jobs/${jobId}`)
      .then((r) => r.json())
      .then((data: Job) => {
        setJob(data);
        setLoading(false);
      });
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
    const majors = Object.values(results).reduce((s, r) => s + r.issues.filter((i) => i.severity === "major").length, 0);
    lines.push(`SUMMARY: ${total} total issue(s) found — ${majors} major, ${total - majors} minor`);
    lines.push("");

    for (const [key, result] of Object.entries(results)) {
      const label = key === "COHERENCE" ? "Cross-Document Coherence" : (DOC_TYPE_LABELS[key as DocType] ?? key);
      lines.push(`=== ${label.toUpperCase()} ===`);
      lines.push(`Status: ${result.status === "ok" ? "PASSED" : result.status === "has_issues" ? "HAS ISSUES" : "ERROR"}`);
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
      <div className="min-h-screen bg-dlsu-green-muted flex items-center justify-center">
        <div className="card p-8 text-center max-w-sm">
          <div className="animate-spin w-8 h-8 border-4 border-dlsu-green border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  if (!job?.results) {
    return (
      <div className="min-h-screen bg-dlsu-green-muted flex items-center justify-center">
        <div className="card p-8 text-center max-w-sm">
          <AlertCircle className="text-red-400 mx-auto mb-3" size={36} />
          <p className="font-semibold text-gray-700">Results not available yet.</p>
          <Link href={`/check/${jobId}`} className="btn-primary mt-4 inline-block">Back to Progress</Link>
        </div>
      </div>
    );
  }

  const results = job.results as Record<string, DocResult>;
  const docKeys = Object.keys(results).filter((k) => k !== "COHERENCE");
  const coherenceResult = results["COHERENCE"];
  const totalIssues = Object.values(results).reduce((s, r) => s + r.issues.length, 0);
  const majorIssues = Object.values(results).reduce((s, r) => s + r.issues.filter((i) => i.severity === "major").length, 0);
  const allOk = totalIssues === 0;

  return (
    <div className="min-h-screen bg-dlsu-green-muted">
      <header className="bg-dlsu-green text-white shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-dlsu-green font-black">G</span>
            </div>
            <span className="font-bold text-lg">GoCheck</span>
          </Link>
          <span className="text-green-200 text-sm">Results</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10">
        {/* Summary card */}
        <div className={`card p-6 mb-6 ${allOk ? "border-green-300 bg-green-50" : majorIssues > 0 ? "border-red-200 bg-red-50" : "border-orange-200 bg-orange-50"}`}>
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${allOk ? "bg-green-100" : majorIssues > 0 ? "bg-red-100" : "bg-orange-100"}`}>
              {allOk ? (
                <CheckCircle className="text-green-500" size={28} />
              ) : (
                <AlertTriangle className={`${majorIssues > 0 ? "text-red-500" : "text-orange-500"}`} size={28} />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {allOk ? "All documents look good!" : `${totalIssues} issue${totalIssues > 1 ? "s" : ""} found`}
              </h2>
              <p className="text-gray-600 text-sm">
                {allOk
                  ? "No issues detected across your submitted documents."
                  : `${majorIssues} major (causes pend) · ${totalIssues - majorIssues} minor (advisory)`}
              </p>
            </div>
            <button
              onClick={handleDownload}
              className="ml-auto flex items-center gap-2 bg-dlsu-green text-white px-4 py-2.5
                         rounded-lg text-sm font-semibold hover:bg-dlsu-green-dark transition-colors flex-shrink-0"
            >
              <Download size={16} />
              Download
            </button>
          </div>
        </div>

        {/* Per-document results */}
        <div className="space-y-3">
          {docKeys.map((key) => (
            <DocResultCard key={key} docType={key} result={results[key]} />
          ))}
          {coherenceResult && (
            <DocResultCard docType="COHERENCE" result={coherenceResult} isCoherence />
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
          <Link href="/upload" className="btn-secondary flex items-center gap-2">
            <FileText size={16} />
            Check More Documents
          </Link>
          <button onClick={handleDownload} className="btn-primary flex items-center gap-2">
            <Download size={16} />
            Download Corrections List
          </button>
        </div>
      </main>
    </div>
  );
}
