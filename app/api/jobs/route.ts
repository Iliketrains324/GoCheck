/**
 * POST /api/jobs
 * Creates a new job, uploads documents to Supabase Storage.
 * Body: multipart/form-data
 *   - files[]: File (PDF)
 *   - docTypes[]: string (DocType for each file, same order as files)
 *   - aformPages[{index}][{page}]: string (base64 PNG, only for AFORM files)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import type { JobFile, DocType } from "@/lib/supabase";

const ALLOWED_DOC_TYPES = new Set([
  "AFORM", "PPR", "LETTER_OF_INVITATION", "CREDENTIALS", "VENUE_RESERVATION",
  "MEETING_AGENDA", "RECRUITMENT_MECHANICS", "LIST_OF_QUESTIONS", "ELECTION_MECHANICS",
  "GENERAL_CONTEST_MECHANICS", "ACADEMIC_CONTEST_MECHANICS", "SAMPLE_PUB",
  "PRE_REGISTRATION_FORM",
]);
const MAX_FILES = 13;
const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20 MB per file
const MAX_AFORM_PAGES = 10;
const MAX_AFORM_PAGE_B64_CHARS = 4 * 1024 * 1024; // ~3 MB decoded per page

export async function POST(req: NextRequest) {
  const db = getServiceClient();

  try {
    const formData = await req.formData();
    const files = formData.getAll("files[]") as File[];
    const docTypes = formData.getAll("docTypes[]") as string[];

    // ── Input validation ──────────────────────────────────────────────────────

    if (!files.length) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }
    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Too many files. Maximum is ${MAX_FILES}.` },
        { status: 400 }
      );
    }
    if (files.length !== docTypes.length) {
      return NextResponse.json(
        { error: "Mismatch between files and docTypes" },
        { status: 400 }
      );
    }

    // Validate each file and docType
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const docType = docTypes[i];

      if (!ALLOWED_DOC_TYPES.has(docType)) {
        return NextResponse.json(
          { error: `Invalid document type: ${docType}` },
          { status: 400 }
        );
      }

      if (file.size > MAX_FILE_BYTES) {
        return NextResponse.json(
          { error: `File "${file.name}" exceeds the 20 MB size limit.` },
          { status: 400 }
        );
      }

      // Validate file extension — only PDFs accepted
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (ext !== "pdf") {
        return NextResponse.json(
          { error: `File "${file.name}" must be a PDF.` },
          { status: 400 }
        );
      }
    }

    // Validate AFORM page counts and sizes
    for (let i = 0; i < files.length; i++) {
      if (docTypes[i] !== "AFORM") continue;
      let pageIdx = 0;
      while (pageIdx <= MAX_AFORM_PAGES) {
        const pageData = formData.get(`aformPages[${i}][${pageIdx}]`) as string | null;
        if (!pageData) break;
        if (pageIdx >= MAX_AFORM_PAGES) {
          return NextResponse.json(
            { error: `AFORM cannot have more than ${MAX_AFORM_PAGES} pages.` },
            { status: 400 }
          );
        }
        if (pageData.length > MAX_AFORM_PAGE_B64_CHARS) {
          return NextResponse.json(
            { error: "An AFORM page image exceeds the allowed size." },
            { status: 400 }
          );
        }
        // Must be a data URI (client-side rendered canvas)
        if (!pageData.startsWith("data:image/")) {
          return NextResponse.json(
            { error: "Invalid AFORM page image format." },
            { status: 400 }
          );
        }
        pageIdx++;
      }
    }

    // ── Create job ────────────────────────────────────────────────────────────

    const { data: job, error: jobErr } = await db
      .from("jobs")
      .insert({
        status: "uploading",
        files: [],
        results: null,
        progress: [],
        error: null,
      })
      .select()
      .single();

    if (jobErr || !job) {
      console.error("Job creation error:", jobErr?.message);
      return NextResponse.json({ error: "Failed to create job" }, { status: 500 });
    }

    const jobId: string = job.id;
    const jobFiles: JobFile[] = [];

    // ── Upload each file ──────────────────────────────────────────────────────

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const docType = docTypes[i] as DocType;
      // Sanitize filename — strip any path traversal characters
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storagePath = `${jobId}/${docType}_${Date.now()}_${safeName}`;

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { error: uploadErr } = await db.storage
        .from("documents")
        .upload(storagePath, buffer, {
          contentType: "application/pdf",
          upsert: false,
        });

      if (uploadErr) {
        console.error("Upload error:", uploadErr.message);
        return NextResponse.json(
          { error: `Upload failed for ${file.name}.` },
          { status: 500 }
        );
      }

      // Collect AFORM page images
      const pages: string[] = [];
      if (docType === "AFORM") {
        let pageIdx = 0;
        while (pageIdx < MAX_AFORM_PAGES) {
          const pageData = formData.get(`aformPages[${i}][${pageIdx}]`) as string | null;
          if (!pageData) break;
          pages.push(pageData);
          pageIdx++;
        }
      }

      jobFiles.push({
        docType,
        fileName: safeName,
        storagePath,
        ...(docType === "AFORM" ? { pages } : {}),
      });
    }

    // Update job with file info
    await db
      .from("jobs")
      .update({ files: jobFiles, status: "pending" })
      .eq("id", jobId);

    return NextResponse.json({ jobId });
  } catch (err) {
    console.error("Unexpected error in POST /api/jobs:", err);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
