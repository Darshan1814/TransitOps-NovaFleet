import { requireRole } from "@/lib/requireRole";
import { closeMaintenance, RuleEngineError } from "@/lib/ruleEngine";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole("FLEET_MANAGER", "ADMIN");
    const { id } = await params;
    const log = await closeMaintenance(id, user.id);
    return NextResponse.json(log);
  } catch (e) {
    if (e instanceof RuleEngineError) {
      return NextResponse.json({ error: e.message }, { status: e.statusCode });
    }
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
