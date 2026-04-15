import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(
  _req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const { jobId } = params;

  if (!UUID_RE.test(jobId)) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const db = getServiceClient();
  const { data: job, error } = await db
    .from("jobs")
    .select("id, status, created_at, updated_at, files, results, progress, error")
    .eq("id", jobId)
    .single();

  if (error || !job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  // Strip rawText from results before returning to client —
  // it contains uploaded document content that should not be exposed
  if (job.results) {
    const sanitized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(job.results as Record<string, Record<string, unknown>>)) {
      const { rawText: _rawText, ...rest } = val;
      sanitized[key] = rest;
    }
    job.results = sanitized;
  }

  return NextResponse.json(job, {
    headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const { jobId } = params;

  if (!UUID_RE.test(jobId)) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const { results, status, progress } = body as {
    results?: unknown;
    status?: string;
    progress?: unknown;
  };

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (results !== undefined) update.results = results;
  if (status !== undefined) update.status = status;
  if (progress !== undefined) update.progress = progress;

  const db = getServiceClient();
  const { error } = await db.from("jobs").update(update).eq("id", jobId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
