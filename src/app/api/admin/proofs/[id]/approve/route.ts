import { requireRole } from "@/lib/requireRole";
import { approveProof, RuleEngineError } from "@/lib/ruleEngine";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole("ADMIN");
    const { id } = await params;
    const body = await req.json();
    const proof = await approveProof(id, user.id, body.note);
    return NextResponse.json(proof);
  } catch (e) {
    if (e instanceof RuleEngineError) {
      return NextResponse.json({ error: e.message }, { status: e.statusCode });
    }
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
