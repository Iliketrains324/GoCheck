"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { DocType } from "@/lib/supabase";
import { DOC_TYPE_LABELS } from "@/lib/supabase";

interface UploadedFile {
  id: string;
  file: File;
  docType: DocType | "";
  /** Base64 page images rendered client-side (AFORM only) */
  pages: string[];
  rendering: boolean;
}

const DOC_OPTIONS = Object.entries(DOC_TYPE_LABELS) as [DocType, string][];

export default function UploadPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const arr = Array.from(newFiles);
    const items: UploadedFile[] = arr.map((f) => ({
      id: Math.random().toString(36).slice(2),
      file: f,
      docType: "",
      pages: [],
      rendering: false,
    }));
    setUploadedFiles((prev) => [...prev, ...items]);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  const handleDocTypeChange = async (id: string, docType: DocType) => {
    setUploadedFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, docType } : f))
    );

    // Both AFORM and PPR use the vision pipeline — render pages as images.
    if (docType === "AFORM" || docType === "PPR") {
      const file = uploadedFiles.find((f) => f.id === id)?.file;
      if (file) {
        setUploadedFiles((prev) =>
          prev.map((f) => (f.id === id ? { ...f, rendering: true } : f))
        );
        const { renderPdfToImages } = await import("@/lib/pdf");
        // Both AFORM and PPR use scale 2.0; AFORM gets 3 strips, PPR gets 2 strips
        const pages = await renderPdfToImages(file, {
          scale: 2.0,
          maxPages: 10,
          sections: docType === "AFORM" ? 3 : 2,
        });
        setUploadedFiles((prev) =>
          prev.map((f) => (f.id === id ? { ...f, pages, rendering: false } : f))
        );
      }
    }
  };

  const removeFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const canSubmit =
    uploadedFiles.length > 0 &&
    uploadedFiles.every((f) => f.docType !== "") &&
    !uploadedFiles.some((f) => f.rendering);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);

    try {
      // AFORM and PPR use vision (pages already rendered); all others get text extraction.
      const { extractTextFromFile } = await import("@/lib/pdf");
      const filesPayload = await Promise.all(
        uploadedFiles.map(async (uf) => {
          if (uf.docType === "AFORM" || uf.docType === "PPR") {
            return { docType: uf.docType, fileName: uf.file.name, pages: uf.pages };
          }
          const text = await extractTextFromFile(uf.file);
          return { docType: uf.docType, fileName: uf.file.name, text };
        })
      );

      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: filesPayload }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "Failed to create job");

      router.push(`/check/${data.jobId}`);
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface font-body text-on-surface">
      {/* Nav */}
      <header className="bg-slate-50/80 glass-nav shadow-sm sticky top-0 z-50 flex justify-between items-center w-full px-8 py-4">
        <Link href="/" className="text-2xl font-black tracking-tighter font-headline bg-gradient-to-r from-emerald-900 to-emerald-700 bg-clip-text text-transparent">
          GoCheck
        </Link>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-tertiary-container/10 rounded-full">
          <span className="h-2 w-2 rounded-full bg-on-tertiary-container" />
          <span className="text-xs font-semibold text-on-tertiary-container font-label">Step 1: Upload</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16">
        {/* Page title */}
        <div className="mb-12">
          <span className="font-headline text-primary font-extrabold tracking-widest text-xs uppercase mb-3 block">
            Document Auditor
          </span>
          <h1 className="font-headline text-4xl font-black tracking-tighter text-primary mb-4">
            Upload Your Documents
          </h1>
          <p className="text-on-surface-variant leading-relaxed">
            Upload PDF files and assign a document type to each one. A-Forms and PPRs
            are analyzed visually — pages render automatically when you select the type.
          </p>
        </div>

        {/* Drop zone */}
        <div
          className={`upload-zone mb-8 ${dragging ? "active" : ""}`}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            multiple
            accept=".pdf,application/pdf"
            onChange={(e) => e.target.files && addFiles(e.target.files)}
          />
          <span className="material-symbols-outlined text-5xl text-primary/30 mb-4 block">upload_file</span>
          <p className="font-headline font-bold text-primary text-lg mb-1">
            Drop PDF files here or click to browse
          </p>
          <p className="text-on-surface-variant text-sm">Supports PDF files only · Multiple files allowed</p>
        </div>

        {/* File list */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-3 mb-10">
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">
              {uploadedFiles.length} file{uploadedFiles.length > 1 ? "s" : ""} selected
            </p>
            {uploadedFiles.map((uf) => (
              <div key={uf.id} className="bg-surface-container-low rounded-xl p-5 flex items-center gap-4">
                <div className="w-10 h-10 bg-surface-container-highest rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-on-surface-variant">description</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-headline font-semibold text-on-surface truncate text-sm">
                    {uf.file.name}
                  </p>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {(uf.file.size / 1024).toFixed(0)} KB
                    {(uf.docType === "AFORM" || uf.docType === "PPR") && uf.pages.length > 0 && (
                      <span className="ml-2 text-on-tertiary-container font-semibold">
                        · {uf.pages.length} pages rendered
                      </span>
                    )}
                    {uf.rendering && (
                      <span className="ml-2 text-primary font-semibold">
                        · Rendering pages...
                      </span>
                    )}
                  </p>
                </div>
                {/* Doc type selector */}
                <div className="flex-shrink-0 relative min-w-[220px]">
                  <select
                    value={uf.docType}
                    onChange={(e) => handleDocTypeChange(uf.id, e.target.value as DocType)}
                    className="w-full bg-transparent border-0 border-b-2 border-primary/40
                               focus:border-primary focus:ring-0 outline-none transition-all
                               font-body text-sm text-on-surface py-2 pr-6 cursor-pointer
                               appearance-none"
                  >
                    <option value="" disabled>Select document type...</option>
                    {DOC_OPTIONS.map(([type, label]) => (
                      <option key={type} value={type}>{label}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-0 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-base">
                    expand_more
                  </span>
                </div>
                <button
                  onClick={() => removeFile(uf.id)}
                  className="text-on-surface-variant/40 hover:text-error transition-colors flex-shrink-0 p-1"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 bg-error-container text-on-error-container rounded-xl p-4 mb-6">
            <span className="material-symbols-outlined text-base">error</span>
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="flex items-center justify-between pt-4">
          <Link href="/" className="text-primary text-sm font-headline font-bold flex items-center gap-1 hover:opacity-70 transition-opacity">
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Back
          </Link>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className="premium-gradient text-white px-8 py-4 rounded-xl font-headline font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {submitting ? (
              <>
                <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                Preparing...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">analytics</span>
                Run Audit
                {uploadedFiles.length > 0 && (
                  <span className="bg-white/20 rounded-full px-2 py-0.5 text-xs">
                    {uploadedFiles.length}
                  </span>
                )}
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}

