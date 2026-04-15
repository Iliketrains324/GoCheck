import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(
  _req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const { jobId } = params;
  if (!UUID_RE.test(jobId)) return NextResponse.json({ error: "Invalid job ID" }, { status: 400 });

  const db = getServiceClient();
  await db.from("jobs").update({ status: "completed", updated_at: new Date().toISOString() }).eq("id", jobId);
  return NextResponse.json({ ok: true });
}
