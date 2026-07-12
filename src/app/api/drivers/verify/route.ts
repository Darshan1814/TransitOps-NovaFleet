import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/requireRole";

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole("DRIVER");
    const body = await req.json();

    const {
      fullName,
      licenseNumber,
      licenseCategory,
      licenseExpiryDate,
      contactNumber,
      region,
      documentBase64,
    } = body;

    // Create the driver profile and proof document in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const driver = await tx.driver.create({
        data: {
          userId: user.id,
          fullName,
          licenseNumber,
          licenseCategory,
          licenseExpiryDate: new Date(licenseExpiryDate),
          contactNumber,
          region,
          status: "SUSPENDED", // Locked until approved
        },
      });

      const proof = await tx.proofDocument.create({
        data: {
          submittedBy: user.id,
          entityType: "DRIVER",
          entityId: driver.id,
          proofType: "LICENSE_DOCUMENT",
          fileUrl: documentBase64,
          status: "PENDING",
        },
      });

      return { driver, proof };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    console.error("Verification error:", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
