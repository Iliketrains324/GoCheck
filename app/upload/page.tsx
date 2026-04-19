"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { DocType } from "@/lib/supabase";
import { DOC_TYPE_LABELS } from "@/lib/supabase";
import { Logo, StepCrumbs } from "@/app/components/logo";
import { ArrowRight, ArrowLeft, Upload, FileIcon, X } from "@/app/components/icons";

interface UploadedFile {
  id: string;
  file: File;
  docType: DocType | "";
  pages: string[];
  rendering: boolean;
}

const DOC_OPTIONS = Object.entries(DOC_TYPE_LABELS) as [DocType, string][];

function FileRow({
  file,
  isLast,
  onType,
  onRemove,
}: {
  file: UploadedFile;
  isLast: boolean;
  onType: (t: DocType) => void;
  onRemove: () => void;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "auto 1fr minmax(220px, 260px) auto",
        gap: 16,
        alignItems: "center",
        padding: "16px 18px",
        borderBottom: isLast ? "none" : "1px solid var(--hairline)",
      }}
    >
      {/* File icon */}
      <div
        style={{
          width: 36, height: 44, borderRadius: 4,
          background: "var(--container)",
          border: "1px solid var(--hairline)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "var(--ink-mute)",
          position: "relative",
          flexShrink: 0,
        }}
      >
        <FileIcon size={16} stroke={1.6} />
        <span
          style={{
            position: "absolute", bottom: -6, right: -6,
            fontFamily: "ui-monospace, Menlo, monospace",
            fontSize: 8, fontWeight: 700,
            background: "var(--ink)", color: "var(--paper)",
            padding: "1px 4px", borderRadius: 2,
          }}
        >
          PDF
        </span>
      </div>

      {/* Name + meta */}
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontFamily: "Inter, system-ui, sans-serif",
            fontWeight: 500, fontSize: 14,
            color: "var(--ink)", letterSpacing: "-0.005em",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}
        >
          {file.file.name}
        </div>
        <div style={{ fontSize: 12, color: "var(--ink-mute)", fontFamily: "Inter, system-ui, sans-serif", marginTop: 2 }}>
          {(file.file.size / 1024).toFixed(0)} KB
          {file.rendering && (
            <span style={{ color: "var(--accent-ink)", marginLeft: 8 }}>· Rendering pages…</span>
          )}
          {!file.rendering && (file.docType === "AFORM" || file.docType === "PPR") && file.pages.length > 0 && (
            <span style={{ color: "var(--accent-ink)", marginLeft: 8 }}>· {file.pages.length} pages rendered</span>
          )}
        </div>
      </div>

      {/* Type selector */}
      <select
        value={file.docType}
        onChange={(e) => onType(e.target.value as DocType)}
        style={{
          background: file.docType ? "var(--container-low)" : "var(--amber-soft)",
          color: file.docType ? "var(--ink)" : "var(--amber-ink)",
          border: "1px solid " + (file.docType ? "var(--hairline)" : "rgba(146,64,14,0.25)"),
          padding: "9px 30px 9px 12px",
          borderRadius: 8,
          fontFamily: "Inter, system-ui, sans-serif",
          fontSize: 13, fontWeight: 500,
          letterSpacing: "-0.005em",
          appearance: "none",
          WebkitAppearance: "none",
          backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'><path d='m6 9 6 6 6-6'/></svg>")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 10px center",
          cursor: "pointer",
          outline: "none",
          width: "100%",
        }}
      >
        <option value="">— Select type —</option>
        {DOC_OPTIONS.map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>

      {/* Remove */}
      <button
        onClick={onRemove}
        style={{
          background: "transparent", border: "none",
          color: "var(--ink-mute)", cursor: "pointer",
          padding: 6, display: "flex", alignItems: "center",
        }}
        aria-label="Remove"
      >
        <X size={16} stroke={1.8} />
      </button>
    </div>
  );
}

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

    if (docType === "AFORM" || docType === "PPR") {
      const file = uploadedFiles.find((f) => f.id === id)?.file;
      if (file) {
        setUploadedFiles((prev) =>
          prev.map((f) => (f.id === id ? { ...f, rendering: true } : f))
        );
        const { renderPdfToImages } = await import("@/lib/pdf");
        const pages = await renderPdfToImages(file, {
          scale: 2.0,
          maxPages: 10,
          sections: docType === "AFORM" ? 3 : 0,
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
            <StepCrumbs step={1} />
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 820, margin: "0 auto", padding: "64px 36px 80px" }}>
        <h1
          style={{
            fontFamily: "Manrope, system-ui, sans-serif",
            fontWeight: 700, fontSize: 44,
            letterSpacing: "-0.03em", lineHeight: 1.05,
            color: "var(--ink)", margin: 0, marginBottom: 14,
          }}
        >
          Upload documents.
        </h1>
        <p
          style={{
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: 16, lineHeight: 1.55,
            color: "var(--ink-mute)", maxWidth: 560,
            margin: "0 0 40px",
          }}
        >
          Drop in your PDFs and tag each one. Activity Form and Project Proposal Form render
          visually; everything else is parsed as text.
        </p>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          style={{
            border: `1.5px dashed ${dragging ? "var(--accent)" : "var(--hairline-strong)"}`,
            borderRadius: 14,
            padding: "44px 24px",
            textAlign: "center",
            background: dragging ? "var(--accent-soft)" : "transparent",
            cursor: "pointer",
            transition: "background 160ms ease, border-color 160ms ease",
            marginBottom: 32,
          }}
        >
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            multiple
            accept=".pdf,application/pdf"
            onChange={(e) => e.target.files && addFiles(e.target.files)}
          />
          <Upload size={28} stroke={1.6} style={{ color: "var(--ink-mute)" }} />
          <div
            style={{
              marginTop: 14,
              fontFamily: "Inter, system-ui, sans-serif",
              fontWeight: 600, fontSize: 15,
              color: "var(--ink)", letterSpacing: "-0.01em",
            }}
          >
            Drop PDFs here or click to browse
          </div>
          <div style={{ marginTop: 4, fontSize: 13, color: "var(--ink-mute)", fontFamily: "Inter, system-ui, sans-serif" }}>
            PDF only · Multiple files OK
          </div>
        </div>

        {/* File list */}
        {uploadedFiles.length > 0 && (
          <>
            <div
              style={{
                display: "flex", alignItems: "baseline", justifyContent: "space-between",
                marginBottom: 14,
              }}
            >
              <span style={{ fontFamily: "Inter, system-ui, sans-serif", fontWeight: 500, fontSize: 12, color: "var(--ink-mute)" }}>
                {uploadedFiles.length} file{uploadedFiles.length > 1 ? "s" : ""} · {uploadedFiles.filter((f) => f.docType).length} tagged
              </span>
              <span style={{ fontSize: 12, color: "var(--ink-mute)", fontFamily: "Inter, system-ui, sans-serif" }}>
                Tap a row to assign a type
              </span>
            </div>
            <div
              style={{
                border: "1px solid var(--hairline)",
                borderRadius: 12, overflow: "hidden",
                background: "var(--paper)",
                marginBottom: 10,
              }}
            >
              {uploadedFiles.map((uf, i) => (
                <FileRow
                  key={uf.id}
                  file={uf}
                  isLast={i === uploadedFiles.length - 1}
                  onType={(t) => handleDocTypeChange(uf.id, t)}
                  onRemove={() => removeFile(uf.id)}
                />
              ))}
            </div>
          </>
        )}

        {/* Error */}
        {error && (
          <div
            style={{
              display: "flex", alignItems: "center", gap: 10,
              background: "#fef2f2", border: "1px solid rgba(186,26,26,0.2)",
              color: "#ba1a1a", borderRadius: 10, padding: "12px 16px",
              fontFamily: "Inter, system-ui, sans-serif", fontSize: 13,
              marginBottom: 20,
            }}
          >
            {error}
          </div>
        )}

        {/* Actions */}
        <div style={{ marginTop: 40, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link
            href="/"
            style={{
              background: "transparent", border: "none",
              display: "inline-flex", alignItems: "center", gap: 6,
              color: "var(--ink)", textDecoration: "none",
              fontFamily: "Inter, system-ui, sans-serif",
              fontSize: 14, fontWeight: 600,
              letterSpacing: "-0.005em",
            }}
          >
            <ArrowLeft size={14} stroke={2} /> Back
          </Link>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            style={{
              background: canSubmit && !submitting ? "var(--ink)" : "var(--container)",
              color: canSubmit && !submitting ? "var(--paper)" : "var(--ink-mute)",
              border: "none",
              padding: "16px 26px",
              borderRadius: 999,
              fontFamily: "Inter, system-ui, sans-serif",
              fontWeight: 600, fontSize: 15,
              cursor: canSubmit && !submitting ? "pointer" : "not-allowed",
              display: "inline-flex", alignItems: "center", gap: 10,
              letterSpacing: "-0.005em",
              transition: "background 120ms ease",
            }}
          >
            {submitting ? (
              <>
                <span
                  style={{
                    width: 14, height: 14, borderRadius: "50%",
                    border: "1.5px solid var(--ink-mute)",
                    borderTopColor: "transparent",
                    animation: "spin 0.8s linear infinite",
                    display: "inline-block",
                  }}
                />
                Preparing…
              </>
            ) : (
              <>
                Run audit
                {uploadedFiles.length > 0 && (
                  <span
                    style={{
                      background: "rgba(255,255,255,0.2)",
                      padding: "2px 8px", borderRadius: 999, fontSize: 11,
                    }}
                  >
                    {uploadedFiles.length}
                  </span>
                )}
                <ArrowRight size={14} stroke={2.2} />
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
