"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Upload,
  FileText,
  X,
  ChevronDown,
  Loader2,
  AlertCircle,
  Eye,
} from "lucide-react";
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

    // If AFORM, render PDF pages to images client-side
    if (docType === "AFORM") {
      const file = uploadedFiles.find((f) => f.id === id)?.file;
      if (file) {
        setUploadedFiles((prev) =>
          prev.map((f) => (f.id === id ? { ...f, rendering: true } : f))
        );
        const pages = await renderPdfToImages(file);
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
      const form = new FormData();
      for (const uf of uploadedFiles) {
        form.append("files[]", uf.file);
        form.append("docTypes[]", uf.docType);
        if (uf.docType === "AFORM") {
          uf.pages.forEach((page, pageIdx) => {
            form.append(`aformPages[${uploadedFiles.indexOf(uf)}][${pageIdx}]`, page);
          });
        }
      }

      const res = await fetch("/api/jobs", { method: "POST", body: form });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "Upload failed");

      const { jobId } = data;

      // Trigger processing (non-blocking from client's perspective)
      fetch(`/api/jobs/${jobId}/process`, { method: "POST" }).catch(() => {});

      router.push(`/check/${jobId}`);
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-dlsu-green-muted">
      {/* Header */}
      <header className="bg-dlsu-green text-white shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-dlsu-green font-black">G</span>
            </div>
            <span className="font-bold text-lg">GoCheck</span>
          </Link>
          <span className="text-green-200 text-sm">Step 1: Upload Documents</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-dlsu-green mb-2">Upload Your Documents</h2>
          <p className="text-gray-500">
            Upload PDF files and select the document type for each. For A-Forms, pages will be
            rendered automatically for visual analysis.
          </p>
        </div>

        {/* Drop zone */}
        <div
          className={`upload-zone mb-6 ${dragging ? "active" : ""}`}
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
          <Upload className="mx-auto mb-3 text-dlsu-green" size={36} />
          <p className="font-semibold text-dlsu-green text-lg mb-1">
            Drop PDF files here or click to browse
          </p>
          <p className="text-gray-400 text-sm">Supports PDF files only · Multiple files allowed</p>
        </div>

        {/* File list */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-3 mb-8">
            <h3 className="font-semibold text-gray-700">
              {uploadedFiles.length} file{uploadedFiles.length > 1 ? "s" : ""} selected
            </h3>
            {uploadedFiles.map((uf) => (
              <div key={uf.id} className="card p-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="text-red-500" size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">{uf.file.name}</p>
                  <p className="text-xs text-gray-400">
                    {(uf.file.size / 1024).toFixed(0)} KB
                    {uf.docType === "AFORM" && uf.pages.length > 0 && (
                      <span className="ml-2 text-dlsu-green font-medium">
                        <Eye size={12} className="inline mr-1" />
                        {uf.pages.length} pages rendered
                      </span>
                    )}
                    {uf.rendering && (
                      <span className="ml-2 text-dlsu-green font-medium">
                        <Loader2 size={12} className="inline mr-1 animate-spin" />
                        Rendering pages...
                      </span>
                    )}
                  </p>
                </div>
                <div className="relative flex-shrink-0">
                  <select
                    value={uf.docType}
                    onChange={(e) => handleDocTypeChange(uf.id, e.target.value as DocType)}
                    className="appearance-none pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm
                               focus:outline-none focus:ring-2 focus:ring-dlsu-green focus:border-transparent
                               bg-white text-gray-700 min-w-[200px]"
                  >
                    <option value="" disabled>Select document type...</option>
                    {DOC_OPTIONS.map(([type, label]) => (
                      <option key={type} value={type}>{label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                </div>
                <button
                  onClick={() => removeFile(uf.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                >
                  <X size={18} />
                </button>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6">
            <AlertCircle size={18} />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <Link href="/" className="text-dlsu-green text-sm hover:underline">
            ← Back to Home
          </Link>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className="btn-primary flex items-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                Check Documents
                <span className="bg-white/20 rounded px-1.5 py-0.5 text-xs">
                  {uploadedFiles.length}
                </span>
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}

// ─── Client-side PDF rendering for AFORM ─────────────────────────────────────

async function renderPdfToImages(file: File): Promise<string[]> {
  try {
    const { getDocument, GlobalWorkerOptions } = await import("pdfjs-dist");
    GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@4.3.136/build/pdf.worker.min.mjs`;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await getDocument({ data: arrayBuffer }).promise;
    const pages: string[] = [];

    for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d")!;
      await page.render({ canvasContext: ctx, viewport }).promise;
      pages.push(canvas.toDataURL("image/png"));
    }

    return pages;
  } catch (err) {
    console.error("PDF render error:", err);
    return [];
  }
}
