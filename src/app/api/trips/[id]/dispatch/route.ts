import { requireRole } from "@/lib/requireRole";
import { dispatchTrip, RuleEngineError } from "@/lib/ruleEngine";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole("FLEET_MANAGER", "DRIVER", "ADMIN");
    const { id } = await params;
    const trip = await dispatchTrip(id, user.id);
    return NextResponse.json(trip);
  } catch (e) {
    if (e instanceof RuleEngineError) {
      return NextResponse.json({ error: e.message }, { status: e.statusCode });
    }
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
