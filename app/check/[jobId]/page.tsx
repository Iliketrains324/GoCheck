"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Loader2, AlertCircle, Clock, FileText } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { DOC_TYPE_LABELS } from "@/lib/supabase";
import type { Job, ProgressEntry, DocType } from "@/lib/supabase";

const STATUS_ICONS = {
  pending: <Clock size={16} className="text-gray-400" />,
  processing: <Loader2 size={16} className="text-dlsu-green animate-spin" />,
  done: <CheckCircle size={16} className="text-green-500" />,
  error: <AlertCircle size={16} className="text-red-500" />,
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Waiting...",
  uploading: "Uploading files...",
  processing: "Checking documents...",
  completed: "All done!",
  failed: "Failed",
};

export default function CheckPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial fetch
    fetch(`/api/jobs/${jobId}`)
      .then((r) => r.json())
      .then((data: Job) => {
        setJob(data);
        setLoading(false);
        if (data.status === "completed") {
          setTimeout(() => router.push(`/results/${jobId}`), 1200);
        }
      });

    // Supabase Realtime subscription
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
  }, [jobId, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-dlsu-green-muted flex items-center justify-center">
        <Loader2 className="text-dlsu-green animate-spin" size={36} />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-dlsu-green-muted flex items-center justify-center">
        <div className="card p-8 text-center max-w-sm">
          <AlertCircle className="text-red-400 mx-auto mb-3" size={36} />
          <p className="font-semibold text-gray-700">Job not found</p>
          <Link href="/upload" className="btn-primary mt-4 inline-block">Start Over</Link>
        </div>
      </div>
    );
  }

  const progress: ProgressEntry[] = job.progress ?? [];
  const jobStatus = job.status;
  const files = job.files ?? [];

  // Build per-doc status from progress entries
  const docStatuses = new Map(progress.map((p) => [p.docType, p]));

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
          <span className="text-green-200 text-sm">Step 2: Processing</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10">
        {/* Overall status */}
        <div className="card p-6 mb-6">
          <div className="flex items-center gap-4">
            <div
              className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0
                ${jobStatus === "completed" ? "bg-green-100" : jobStatus === "failed" ? "bg-red-100" : "bg-dlsu-green-muted"}`}
            >
              {jobStatus === "completed" ? (
                <CheckCircle className="text-green-500" size={28} />
              ) : jobStatus === "failed" ? (
                <AlertCircle className="text-red-500" size={28} />
              ) : (
                <Loader2 className="text-dlsu-green animate-spin" size={28} />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {STATUS_LABELS[jobStatus] ?? jobStatus}
              </h2>
              <p className="text-gray-500 text-sm">
                {jobStatus === "completed"
                  ? "Redirecting to results..."
                  : jobStatus === "failed"
                  ? job.error ?? "An error occurred."
                  : `Analyzing ${files.length} document${files.length > 1 ? "s" : ""}...`}
              </p>
            </div>
          </div>

          {/* Overall progress bar */}
          {jobStatus !== "completed" && jobStatus !== "failed" && (
            <div className="mt-4 bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-dlsu-green transition-all duration-500 animate-pulse-bar rounded-full"
                style={{
                  width: `${Math.max(
                    10,
                    (progress.filter((p) => p.status === "done").length / Math.max(files.length, 1)) * 100
                  )}%`,
                }}
              />
            </div>
          )}
        </div>

        {/* Per-document progress */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-700 mb-2">Documents</h3>
          {files.map((file) => {
            const prog = docStatuses.get(file.docType);
            const docStatus = prog?.status ?? "pending";

            return (
              <div key={file.docType} className="card p-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText size={18} className="text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 text-sm">
                    {DOC_TYPE_LABELS[file.docType as DocType] ?? file.docType}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{file.fileName}</p>
                  {prog?.message && (
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{prog.message}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {STATUS_ICONS[docStatus as keyof typeof STATUS_ICONS] ?? STATUS_ICONS.pending}
                  <span
                    className={`text-xs font-medium ${
                      docStatus === "done"
                        ? "text-green-600"
                        : docStatus === "error"
                        ? "text-red-500"
                        : docStatus === "processing"
                        ? "text-dlsu-green"
                        : "text-gray-400"
                    }`}
                  >
                    {docStatus === "done" ? "Done" : docStatus === "error" ? "Error" : docStatus === "processing" ? "Checking..." : "Queued"}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Coherence check row */}
          {files.length > 1 && (
            <div className="card p-4 flex items-center gap-4 border-dlsu-green border-2">
              <div className="w-10 h-10 bg-dlsu-green-muted rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-dlsu-green text-lg">🔗</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-dlsu-green text-sm">Cross-Document Coherence Check</p>
                <p className="text-xs text-gray-400">Checks for inconsistencies between all documents</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {(() => {
                  const coherenceProg = docStatuses.get("AFORM");
                  if (jobStatus === "completed") return <><CheckCircle size={16} className="text-green-500" /><span className="text-xs font-medium text-green-600">Done</span></>;
                  if (coherenceProg?.status === "processing") return <><Loader2 size={16} className="text-dlsu-green animate-spin" /><span className="text-xs font-medium text-dlsu-green">Checking...</span></>;
                  return <><Clock size={16} className="text-gray-400" /><span className="text-xs text-gray-400">Queued</span></>;
                })()}
              </div>
            </div>
          )}
        </div>

        {jobStatus === "failed" && (
          <div className="mt-6 flex gap-3">
            <Link href="/upload" className="btn-secondary">Try Again</Link>
          </div>
        )}
      </main>
    </div>
  );
}
