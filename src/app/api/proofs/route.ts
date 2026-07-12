import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/requireRole";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await requireRole("ADMIN", "FLEET_MANAGER", "SAFETY_OFFICER");
    const proofs = await prisma.proofDocument.findMany({
      orderBy: { submittedAt: "desc" },
    });
    return NextResponse.json(proofs);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
