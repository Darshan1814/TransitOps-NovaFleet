import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/requireRole";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireRole("SAFETY_OFFICER", "ADMIN");
    const { id } = params;

    const proof = await prisma.proofDocument.findUnique({ where: { id } });
    if (!proof) return NextResponse.json({ error: "Proof not found" }, { status: 404 });

    const updatedProof = await prisma.$transaction(async (tx) => {
      const p = await tx.proofDocument.update({
        where: { id },
        data: {
          status: "REJECTED",
          reviewedBy: session.user.id,
          reviewedAt: new Date(),
        },
      });

      if (p.entityType === "DRIVER") {
        // If rejected, we delete the pending driver so they can re-submit completely
        await tx.driver.delete({
          where: { id: p.entityId },
        });
      }
      return p;
    });

    return NextResponse.json(updatedProof);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
