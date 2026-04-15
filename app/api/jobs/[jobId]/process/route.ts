/**
 * POST /api/jobs/[jobId]/process
 * Triggers the orchestrator for a job.
 * Responds immediately; processing continues in the background via Supabase updates.
 */

import { NextRequest, NextResponse } from "next/server";
import { runOrchestrator } from "@/lib/agents/orchestrator";

export const maxDuration = 300;

export async function POST(
  _req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const { jobId } = params;

  // Fire and return — the function stays alive until processing finishes
  // because Vercel keeps the function open while awaiting
  try {
    await runOrchestrator(jobId);
    return NextResponse.json({ status: "completed", jobId });
  } catch (err) {
    return NextResponse.json(
      { status: "failed", error: (err as Error).message },
      { status: 500 }
    );
  }
}
