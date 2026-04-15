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

export async function POST(req: NextRequest) {
  const db = getServiceClient();

  try {
    const formData = await req.formData();
    const files = formData.getAll("files[]") as File[];
    const docTypes = formData.getAll("docTypes[]") as DocType[];

    if (!files.length || files.length !== docTypes.length) {
      return NextResponse.json(
        { error: "Mismatch between files and docTypes" },
        { status: 400 }
      );
    }

    // Create job record
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
      return NextResponse.json({ error: jobErr?.message ?? "Failed to create job" }, { status: 500 });
    }

    const jobId: string = job.id;
    const jobFiles: JobFile[] = [];

    // Upload each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const docType = docTypes[i];
      const storagePath = `${jobId}/${docType}_${Date.now()}_${file.name}`;

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { error: uploadErr } = await db.storage
        .from("documents")
        .upload(storagePath, buffer, {
          contentType: file.type || "application/pdf",
          upsert: false,
        });

      if (uploadErr) {
        return NextResponse.json(
          { error: `Upload failed for ${file.name}: ${uploadErr.message}` },
          { status: 500 }
        );
      }

      // Collect AFORM page images if provided
      const pages: string[] = [];
      if (docType === "AFORM") {
        let pageIdx = 0;
        while (true) {
          const pageKey = `aformPages[${i}][${pageIdx}]`;
          const pageData = formData.get(pageKey) as string | null;
          if (!pageData) break;
          pages.push(pageData);
          pageIdx++;
        }
      }

      jobFiles.push({
        docType,
        fileName: file.name,
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
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
