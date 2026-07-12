import { prisma } from "./prisma";

export class RuleEngineError extends Error {
  public statusCode: number;
  constructor(message: string, statusCode: number = 422) {
    super(message);
    this.name = "RuleEngineError";
    this.statusCode = statusCode;
  }
}

// ============================================
// 6.1 TRIP DISPATCH
// ============================================
export async function dispatchTrip(tripId: string, actorId?: string) {
  return prisma.$transaction(async (tx) => {
    const trip = await tx.trip.findUnique({
      where: { id: tripId },
      include: { vehicle: true, driver: true },
    });

    if (!trip) throw new RuleEngineError("Trip not found", 404);
    if (trip.status !== "DRAFT") throw new RuleEngineError("Trip must be in DRAFT status to dispatch", 409);
    if (trip.vehicle.status !== "AVAILABLE") throw new RuleEngineError("Vehicle not available", 409);
    if (trip.driver.status !== "AVAILABLE") throw new RuleEngineError("Driver not available", 409);
    if (trip.driver.licenseExpiryDate < new Date()) throw new RuleEngineError("Driver license expired", 422);
    if (trip.driver.status === "SUSPENDED") throw new RuleEngineError("Driver is suspended", 422);
    if (Number(trip.cargoWeightKg) > Number(trip.vehicle.maxLoadCapacityKg)) {
      throw new RuleEngineError(
        `Cargo (${trip.cargoWeightKg}kg) exceeds vehicle capacity (${trip.vehicle.maxLoadCapacityKg}kg)`,
        422
      );
    }

    const updatedTrip = await tx.trip.update({
      where: { id: tripId },
      data: { status: "DISPATCHED", dispatchedAt: new Date() },
    });

    await tx.vehicle.update({
      where: { id: trip.vehicleId },
      data: { status: "ON_TRIP" },
    });

    await tx.driver.update({
      where: { id: trip.driverId },
      data: { status: "ON_TRIP" },
    });

    // Audit log
    await tx.auditLog.create({
      data: {
        actorId,
        action: "TRIP_DISPATCHED",
        tableName: "trips",
        recordId: tripId,
        afterState: { status: "DISPATCHED", vehicleId: trip.vehicleId, driverId: trip.driverId },
      },
    });

    return updatedTrip;
  });
}

// ============================================
// 6.2 TRIP COMPLETION
// ============================================
export async function completeTrip(
  tripId: string,
  data: { actualDistanceKm: number; fuelConsumedL: number; revenue?: number },
  actorId?: string
) {
  return prisma.$transaction(async (tx) => {
    const trip = await tx.trip.findUnique({
      where: { id: tripId },
      include: { vehicle: true, driver: true },
    });

    if (!trip) throw new RuleEngineError("Trip not found", 404);
    if (trip.status !== "DISPATCHED") throw new RuleEngineError("Trip must be DISPATCHED to complete", 409);

    const updatedTrip = await tx.trip.update({
      where: { id: tripId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        actualDistanceKm: data.actualDistanceKm,
        fuelConsumedL: data.fuelConsumedL,
        revenue: data.revenue,
      },
    });

    // Update vehicle odometer and status
    await tx.vehicle.update({
      where: { id: trip.vehicleId },
      data: {
        status: "AVAILABLE",
        odometerKm: { increment: data.actualDistanceKm },
      },
    });

    // Restore driver status
    await tx.driver.update({
      where: { id: trip.driverId },
      data: { status: "AVAILABLE" },
    });

    // Auto-insert fuel log
    if (data.fuelConsumedL > 0) {
      await tx.fuelLog.create({
        data: {
          vehicleId: trip.vehicleId,
          tripId: tripId,
          liters: data.fuelConsumedL,
          cost: data.fuelConsumedL * 95, // ~₹95/L average for diesel
          createdBy: actorId,
        },
      });
    }

    // Audit log
    await tx.auditLog.create({
      data: {
        actorId,
        action: "TRIP_COMPLETED",
        tableName: "trips",
        recordId: tripId,
        beforeState: { status: "DISPATCHED" },
        afterState: {
          status: "COMPLETED",
          actualDistanceKm: data.actualDistanceKm,
          fuelConsumedL: data.fuelConsumedL,
        },
      },
    });

    return updatedTrip;
  });
}

// ============================================
// 6.3 TRIP CANCELLATION
// ============================================
export async function cancelTrip(tripId: string, actorId?: string) {
  return prisma.$transaction(async (tx) => {
    const trip = await tx.trip.findUnique({
      where: { id: tripId },
      include: { vehicle: true, driver: true },
    });

    if (!trip) throw new RuleEngineError("Trip not found", 404);
    if (trip.status !== "DISPATCHED" && trip.status !== "DRAFT") {
      throw new RuleEngineError("Only DRAFT or DISPATCHED trips can be cancelled", 409);
    }

    const updatedTrip = await tx.trip.update({
      where: { id: tripId },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });

    // Restore vehicle and driver only if was dispatched
    if (trip.status === "DISPATCHED") {
      await tx.vehicle.update({
        where: { id: trip.vehicleId },
        data: { status: "AVAILABLE" },
      });

      await tx.driver.update({
        where: { id: trip.driverId },
        data: { status: "AVAILABLE" },
      });
    }

    await tx.auditLog.create({
      data: {
        actorId,
        action: "TRIP_CANCELLED",
        tableName: "trips",
        recordId: tripId,
        beforeState: { status: trip.status },
        afterState: { status: "CANCELLED" },
      },
    });

    return updatedTrip;
  });
}

// ============================================
// 6.4 MAINTENANCE OPEN
// ============================================
export async function openMaintenance(
  data: { vehicleId: string; title: string; description?: string; cost?: number },
  actorId?: string
) {
  return prisma.$transaction(async (tx) => {
    const vehicle = await tx.vehicle.findUnique({ where: { id: data.vehicleId } });
    if (!vehicle) throw new RuleEngineError("Vehicle not found", 404);
    if (vehicle.status === "ON_TRIP") {
      throw new RuleEngineError("Cannot open maintenance for a vehicle on trip", 409);
    }

    const log = await tx.maintenanceLog.create({
      data: {
        vehicleId: data.vehicleId,
        title: data.title,
        description: data.description,
        cost: data.cost ?? 0,
        status: "OPEN",
        createdBy: actorId,
      },
    });

    await tx.vehicle.update({
      where: { id: data.vehicleId },
      data: { status: "IN_SHOP" },
    });

    await tx.auditLog.create({
      data: {
        actorId,
        action: "MAINTENANCE_OPENED",
        tableName: "maintenance_logs",
        recordId: log.id,
        afterState: { vehicleId: data.vehicleId, title: data.title },
      },
    });

    return log;
  });
}

// ============================================
// 6.5 MAINTENANCE CLOSE
// ============================================
export async function closeMaintenance(logId: string, actorId?: string) {
  return prisma.$transaction(async (tx) => {
    const log = await tx.maintenanceLog.findUnique({
      where: { id: logId },
      include: { vehicle: true },
    });

    if (!log) throw new RuleEngineError("Maintenance log not found", 404);
    if (log.status === "CLOSED") throw new RuleEngineError("Maintenance already closed", 409);

    const updatedLog = await tx.maintenanceLog.update({
      where: { id: logId },
      data: { status: "CLOSED", closedAt: new Date() },
    });

    // Restore vehicle unless retired
    if (log.vehicle.status !== "RETIRED") {
      await tx.vehicle.update({
        where: { id: log.vehicleId },
        data: { status: "AVAILABLE" },
      });
    }

    await tx.auditLog.create({
      data: {
        actorId,
        action: "MAINTENANCE_CLOSED",
        tableName: "maintenance_logs",
        recordId: logId,
        beforeState: { status: log.status },
        afterState: { status: "CLOSED" },
      },
    });

    return updatedLog;
  });
}

// ============================================
// 6.6 PROOF/DOCUMENT APPROVAL
// ============================================
export async function approveProof(proofId: string, reviewerId: string, note?: string) {
  return prisma.$transaction(async (tx) => {
    const proof = await tx.proofDocument.findUnique({ where: { id: proofId } });
    if (!proof) throw new RuleEngineError("Proof document not found", 404);
    if (proof.status !== "PENDING") throw new RuleEngineError("Proof already reviewed", 409);

    const updatedProof = await tx.proofDocument.update({
      where: { id: proofId },
      data: {
        status: "APPROVED",
        reviewedBy: reviewerId,
        reviewNote: note ?? "Approved",
        reviewedAt: new Date(),
      },
    });

    // If driver license proof approved, ensure driver is available
    if (proof.entityType === "DRIVER" && proof.proofType === "DRIVER_LICENSE") {
      const driver = await tx.driver.findUnique({ where: { id: proof.entityId } });
      if (driver && driver.status !== "ON_TRIP") {
        await tx.driver.update({
          where: { id: proof.entityId },
          data: { status: "AVAILABLE" },
        });
      }
    }

    // Notify the submitter
    await tx.notification.create({
      data: {
        userId: proof.submittedBy,
        title: "Document Approved ✅",
        body: `Your ${proof.proofType.replace(/_/g, " ").toLowerCase()} proof has been approved.`,
        severity: "INFO",
      },
    });

    // Update dashboard request if exists
    await tx.dashboardRequest.updateMany({
      where: {
        referenceTable: "proof_documents",
        referenceId: proofId,
        status: "PENDING",
      },
      data: {
        status: "APPROVED",
        resolvedBy: reviewerId,
        resolvedAt: new Date(),
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: reviewerId,
        action: "PROOF_APPROVED",
        tableName: "proof_documents",
        recordId: proofId,
        afterState: { status: "APPROVED", reviewedBy: reviewerId },
      },
    });

    return updatedProof;
  });
}

export async function rejectProof(proofId: string, reviewerId: string, note: string) {
  if (!note || note.trim().length === 0) {
    throw new RuleEngineError("Rejection note is required", 422);
  }

  return prisma.$transaction(async (tx) => {
    const proof = await tx.proofDocument.findUnique({ where: { id: proofId } });
    if (!proof) throw new RuleEngineError("Proof document not found", 404);
    if (proof.status !== "PENDING") throw new RuleEngineError("Proof already reviewed", 409);

    const updatedProof = await tx.proofDocument.update({
      where: { id: proofId },
      data: {
        status: "REJECTED",
        reviewedBy: reviewerId,
        reviewNote: note,
        reviewedAt: new Date(),
      },
    });

    await tx.notification.create({
      data: {
        userId: proof.submittedBy,
        title: "Document Rejected ❌",
        body: `Your ${proof.proofType.replace(/_/g, " ").toLowerCase()} proof was rejected: "${note}"`,
        severity: "WARNING",
      },
    });

    await tx.dashboardRequest.updateMany({
      where: {
        referenceTable: "proof_documents",
        referenceId: proofId,
        status: "PENDING",
      },
      data: {
        status: "REJECTED",
        resolvedBy: reviewerId,
        resolvedAt: new Date(),
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: reviewerId,
        action: "PROOF_REJECTED",
        tableName: "proof_documents",
        recordId: proofId,
        afterState: { status: "REJECTED", reviewNote: note },
      },
    });

    return updatedProof;
  });
}

// ============================================
// DRIVER SUSPENSION / REINSTATEMENT
// ============================================
export async function suspendDriver(driverId: string, actorId?: string) {
  return prisma.$transaction(async (tx) => {
    const driver = await tx.driver.findUnique({ where: { id: driverId } });
    if (!driver) throw new RuleEngineError("Driver not found", 404);
    if (driver.status === "ON_TRIP") throw new RuleEngineError("Cannot suspend driver on active trip", 409);
    if (driver.status === "SUSPENDED") throw new RuleEngineError("Driver already suspended", 409);

    const updated = await tx.driver.update({
      where: { id: driverId },
      data: { status: "SUSPENDED" },
    });

    await tx.auditLog.create({
      data: {
        actorId,
        action: "DRIVER_SUSPENDED",
        tableName: "drivers",
        recordId: driverId,
        beforeState: { status: driver.status },
        afterState: { status: "SUSPENDED" },
      },
    });

    return updated;
  });
}

export async function reinstateDriver(driverId: string, actorId?: string) {
  return prisma.$transaction(async (tx) => {
    const driver = await tx.driver.findUnique({ where: { id: driverId } });
    if (!driver) throw new RuleEngineError("Driver not found", 404);
    if (driver.status !== "SUSPENDED") throw new RuleEngineError("Driver is not suspended", 409);

    const updated = await tx.driver.update({
      where: { id: driverId },
      data: { status: "AVAILABLE" },
    });

    await tx.auditLog.create({
      data: {
        actorId,
        action: "DRIVER_REINSTATED",
        tableName: "drivers",
        recordId: driverId,
        beforeState: { status: "SUSPENDED" },
        afterState: { status: "AVAILABLE" },
      },
    });

    return updated;
  });
}
