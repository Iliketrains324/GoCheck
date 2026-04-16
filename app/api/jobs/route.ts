/**
 * POST /api/jobs
 * Creates a new job record. All PDF content (text/pages) is extracted client-side
 * and passed here in the request body — no Supabase Storage uploads.
 * Body JSON: { files: [{ docType, fileName, pages?, text? }] }
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
// Max extracted text per document (100 KB) and max base64 pages per AFORM doc (10 pages × ~3 MB each = 30 MB hard cap per file)
const MAX_TEXT_BYTES = 100_000;
const MAX_PAGES = 10;
const MAX_PAGE_BYTES = 3_000_000; // ~3 MB per page image

export async function POST(req: NextRequest) {
  const db = getServiceClient();

  try {
    const body = await req.json().catch(() => null);
    if (!body || !Array.isArray(body.files)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const files = body.files as Array<{
      docType: string;
      fileName: string;
      pages?: string[];
      text?: string;
    }>;

    if (!files.length) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }
    if (files.length > MAX_FILES) {
      return NextResponse.json({ error: `Too many files. Maximum is ${MAX_FILES}.` }, { status: 400 });
    }
    for (const f of files) {
      if (!ALLOWED_DOC_TYPES.has(f.docType)) {
        return NextResponse.json({ error: `Invalid document type: ${f.docType}` }, { status: 400 });
      }
      if (f.text && f.text.length > MAX_TEXT_BYTES) {
        return NextResponse.json({ error: `Text payload too large for ${f.docType} (max 100 KB)` }, { status: 400 });
      }
      if (f.pages) {
        if (f.pages.length > MAX_PAGES) {
          return NextResponse.json({ error: `Too many pages for ${f.docType} (max ${MAX_PAGES})` }, { status: 400 });
        }
        for (const page of f.pages) {
          if (page.length > MAX_PAGE_BYTES) {
            return NextResponse.json({ error: `Page image too large for ${f.docType} (max 3 MB per page)` }, { status: 400 });
          }
        }
      }
    }

    const jobFiles: JobFile[] = files.map((f) => ({
      docType: f.docType as DocType,
      fileName: f.fileName,
      storagePath: "",
      ...(f.pages?.length ? { pages: f.pages } : {}),
      ...(f.text ? { text: f.text } : {}),
    }));

    const { data: job, error: jobErr } = await db
      .from("jobs")
      .insert({
        status: "pending",
        files: jobFiles,
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

    return NextResponse.json({ jobId: job.id });
  } catch (err) {
    console.error("Unexpected error in POST /api/jobs:", err);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
