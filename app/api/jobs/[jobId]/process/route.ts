/**
 * POST /api/jobs/[jobId]/process
 * Triggers the orchestrator for a job.
 * Only runs if the job is in "pending" status — prevents duplicate processing.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { runOrchestrator } from "@/lib/agents/orchestrator";

export const maxDuration = 300;

// Basic UUID v4 pattern to reject obviously invalid jobIds before hitting DB
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(
  _req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const { jobId } = params;

  if (!UUID_RE.test(jobId)) {
    return NextResponse.json({ error: "Invalid job ID" }, { status: 400 });
  }

  const db = getServiceClient();

  // Fetch job and guard against double-processing
  const { data: job, error } = await db
    .from("jobs")
    .select("id, status")
    .eq("id", jobId)
    .single();

  if (error || !job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  if (job.status !== "pending") {
    // Already running or done — silently succeed so the client isn't broken
    return NextResponse.json({ status: job.status, jobId });
  }

  try {
    await runOrchestrator(jobId);
    return NextResponse.json({ status: "completed", jobId });
  } catch (err) {
    console.error("Orchestrator error:", err);
    return NextResponse.json(
      { status: "failed", error: "Processing failed." },
      { status: 500 }
    );
  }
}
