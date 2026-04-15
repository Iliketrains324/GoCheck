import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export async function GET(
  _req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const db = getServiceClient();
  const { data: job, error } = await db
    .from("jobs")
    .select("*")
    .eq("id", params.jobId)
    .single();

  if (error || !job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json(job);
}
