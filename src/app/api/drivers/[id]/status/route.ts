import { requireRole } from "@/lib/requireRole";
import { suspendDriver, reinstateDriver, RuleEngineError } from "@/lib/ruleEngine";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole("SAFETY_OFFICER", "ADMIN");
    const { id } = await params;
    const body = await req.json();
    const action = body.action; // 'suspend' or 'reinstate'

    let driver;
    if (action === "suspend") {
      driver = await suspendDriver(id, user.id);
    } else if (action === "reinstate") {
      driver = await reinstateDriver(id, user.id);
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json(driver);
  } catch (e) {
    if (e instanceof RuleEngineError) {
      return NextResponse.json({ error: e.message }, { status: e.statusCode });
    }
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
