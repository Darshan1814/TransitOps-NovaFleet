import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌌 Seeding NovaFleet database...\n");

  // Clear existing data
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.dashboardRequest.deleteMany();
  await prisma.proofDocument.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.fuelLog.deleteMany();
  await prisma.maintenanceLog.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();

  const hash = await bcrypt.hash("password123", 10);

  // ==================== USERS ====================
  console.log("👤 Creating users...");
  const users = await Promise.all([
    prisma.user.create({
      data: {
        fullName: "Commander Alex Nova",
        email: "fleet@novafleet.io",
        passwordHash: hash,
        role: "FLEET_MANAGER",
        region: "North",
      },
    }),
    prisma.user.create({
      data: {
        fullName: "Pilot Ravi Kumar",
        email: "driver@novafleet.io",
        passwordHash: hash,
        role: "DRIVER",
        region: "North",
      },
    }),
    prisma.user.create({
      data: {
        fullName: "Officer Priya Sharma",
        email: "safety@novafleet.io",
        passwordHash: hash,
        role: "SAFETY_OFFICER",
        region: "North",
      },
    }),
    prisma.user.create({
      data: {
        fullName: "Analyst Deepak Verma",
        email: "finance@novafleet.io",
        passwordHash: hash,
        role: "FINANCIAL_ANALYST",
        region: "North",
      },
    }),
    prisma.user.create({
      data: {
        fullName: "Admiral Sita Patel",
        email: "admin@novafleet.io",
        passwordHash: hash,
        role: "ADMIN",
        region: "All",
      },
    }),
  ]);

  console.log(`   ✅ Created ${users.length} users`);

  // ==================== VEHICLES ====================
  console.log("🚛 Creating vehicles...");
  const vehicles = await Promise.all([
    prisma.vehicle.create({
      data: {
        registrationNumber: "NF-TRK-001",
        nameModel: "Tata Prima 4928",
        vehicleType: "Heavy Truck",
        maxLoadCapacityKg: 28000,
        odometerKm: 145200,
        acquisitionCost: 3200000,
        region: "North",
        status: "AVAILABLE",
      },
    }),
    prisma.vehicle.create({
      data: {
        registrationNumber: "NF-TRK-002",
        nameModel: "Ashok Leyland 4220",
        vehicleType: "Heavy Truck",
        maxLoadCapacityKg: 25000,
        odometerKm: 98700,
        acquisitionCost: 2800000,
        region: "North",
        status: "ON_TRIP",
      },
    }),
    prisma.vehicle.create({
      data: {
        registrationNumber: "NF-VAN-003",
        nameModel: "Mahindra Bolero Pickup",
        vehicleType: "Van",
        maxLoadCapacityKg: 1500,
        odometerKm: 67300,
        acquisitionCost: 850000,
        region: "South",
        status: "AVAILABLE",
      },
    }),
    prisma.vehicle.create({
      data: {
        registrationNumber: "NF-TRK-004",
        nameModel: "BharatBenz 1617R",
        vehicleType: "Medium Truck",
        maxLoadCapacityKg: 16000,
        odometerKm: 210400,
        acquisitionCost: 1950000,
        region: "West",
        status: "IN_SHOP",
      },
    }),
    prisma.vehicle.create({
      data: {
        registrationNumber: "NF-VAN-005",
        nameModel: "Tata Ace Gold",
        vehicleType: "Mini Truck",
        maxLoadCapacityKg: 750,
        odometerKm: 42100,
        acquisitionCost: 450000,
        region: "East",
        status: "AVAILABLE",
      },
    }),
    prisma.vehicle.create({
      data: {
        registrationNumber: "NF-TRK-006",
        nameModel: "Eicher Pro 3019",
        vehicleType: "Medium Truck",
        maxLoadCapacityKg: 19000,
        odometerKm: 178000,
        acquisitionCost: 2100000,
        region: "North",
        status: "AVAILABLE",
      },
    }),
    prisma.vehicle.create({
      data: {
        registrationNumber: "NF-BKE-007",
        nameModel: "TVS King Cargo",
        vehicleType: "Three-Wheeler",
        maxLoadCapacityKg: 500,
        odometerKm: 31500,
        acquisitionCost: 280000,
        region: "South",
        status: "AVAILABLE",
      },
    }),
    prisma.vehicle.create({
      data: {
        registrationNumber: "NF-TRK-008",
        nameModel: "Volvo FH16",
        vehicleType: "Heavy Truck",
        maxLoadCapacityKg: 35000,
        odometerKm: 320000,
        acquisitionCost: 7500000,
        region: "West",
        status: "AVAILABLE",
      },
    }),
    prisma.vehicle.create({
      data: {
        registrationNumber: "NF-VAN-009",
        nameModel: "Force Traveller",
        vehicleType: "Van",
        maxLoadCapacityKg: 2000,
        odometerKm: 89600,
        acquisitionCost: 1200000,
        region: "North",
        status: "RETIRED",
      },
    }),
    prisma.vehicle.create({
      data: {
        registrationNumber: "NF-TRK-010",
        nameModel: "Scania P410",
        vehicleType: "Heavy Truck",
        maxLoadCapacityKg: 30000,
        odometerKm: 260000,
        acquisitionCost: 6800000,
        region: "East",
        status: "AVAILABLE",
      },
    }),
  ]);

  console.log(`   ✅ Created ${vehicles.length} vehicles`);

  // ==================== DRIVERS ====================
  console.log("🧑‍✈️ Creating drivers...");
  const now = new Date();
  const drivers = await Promise.all([
    prisma.driver.create({
      data: {
        userId: users[1].id, // Ravi Kumar
        fullName: "Ravi Kumar",
        licenseNumber: "DL-2024-NF001",
        licenseCategory: "HMV",
        licenseExpiryDate: new Date(now.getFullYear() + 1, 5, 15),
        contactNumber: "+91 98765 43210",
        safetyScore: 94.5,
        region: "North",
        status: "AVAILABLE",
      },
    }),
    prisma.driver.create({
      data: {
        fullName: "Suresh Yadav",
        licenseNumber: "DL-2023-NF002",
        licenseCategory: "HMV",
        licenseExpiryDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5), // Expiring in 5 days!
        contactNumber: "+91 98765 43211",
        safetyScore: 78.2,
        region: "North",
        status: "AVAILABLE",
      },
    }),
    prisma.driver.create({
      data: {
        fullName: "Meena Devi",
        licenseNumber: "DL-2024-NF003",
        licenseCategory: "LMV",
        licenseExpiryDate: new Date(now.getFullYear() + 2, 2, 20),
        contactNumber: "+91 98765 43212",
        safetyScore: 97.8,
        region: "South",
        status: "ON_TRIP",
      },
    }),
    prisma.driver.create({
      data: {
        fullName: "Arun Pillai",
        licenseNumber: "DL-2023-NF004",
        licenseCategory: "HMV",
        licenseExpiryDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 22), // Expiring in 22 days
        contactNumber: "+91 98765 43213",
        safetyScore: 85.1,
        region: "West",
        status: "AVAILABLE",
      },
    }),
    prisma.driver.create({
      data: {
        fullName: "Kiran Deshmukh",
        licenseNumber: "DL-2024-NF005",
        licenseCategory: "HMV",
        licenseExpiryDate: new Date(now.getFullYear() + 1, 8, 10),
        contactNumber: "+91 98765 43214",
        safetyScore: 91.3,
        region: "East",
        status: "AVAILABLE",
      },
    }),
    prisma.driver.create({
      data: {
        fullName: "Lakshmi Nair",
        licenseNumber: "DL-2024-NF006",
        licenseCategory: "LMV",
        licenseExpiryDate: new Date(now.getFullYear() + 1, 11, 30),
        contactNumber: "+91 98765 43215",
        safetyScore: 99.2,
        region: "South",
        status: "AVAILABLE",
      },
    }),
    prisma.driver.create({
      data: {
        fullName: "Vikram Singh",
        licenseNumber: "DL-2022-NF007",
        licenseCategory: "HMV",
        licenseExpiryDate: new Date(now.getFullYear(), now.getMonth() - 1, 15), // Already expired!
        contactNumber: "+91 98765 43216",
        safetyScore: 62.4,
        region: "North",
        status: "SUSPENDED",
      },
    }),
    prisma.driver.create({
      data: {
        fullName: "Anita Joshi",
        licenseNumber: "DL-2024-NF008",
        licenseCategory: "HMV",
        licenseExpiryDate: new Date(now.getFullYear() + 1, 3, 5),
        contactNumber: "+91 98765 43217",
        safetyScore: 88.7,
        region: "West",
        status: "AVAILABLE",
      },
    }),
  ]);

  console.log(`   ✅ Created ${drivers.length} drivers`);

  // ==================== TRIPS ====================
  console.log("🚀 Creating trips...");
  const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);

  const trips = await Promise.all([
    // Completed trips
    prisma.trip.create({
      data: {
        source: "Mumbai Warehouse",
        destination: "Delhi Distribution Center",
        vehicleId: vehicles[0].id,
        driverId: drivers[0].id,
        cargoWeightKg: 22000,
        plannedDistanceKm: 1420,
        actualDistanceKm: 1450,
        fuelConsumedL: 380,
        revenue: 85000,
        status: "COMPLETED",
        dispatchedAt: daysAgo(7),
        completedAt: daysAgo(5),
        createdBy: users[0].id,
        createdAt: daysAgo(8),
      },
    }),
    prisma.trip.create({
      data: {
        source: "Chennai Port",
        destination: "Bangalore Hub",
        vehicleId: vehicles[2].id,
        driverId: drivers[2].id,
        cargoWeightKg: 1200,
        plannedDistanceKm: 350,
        actualDistanceKm: 365,
        fuelConsumedL: 45,
        revenue: 25000,
        status: "COMPLETED",
        dispatchedAt: daysAgo(5),
        completedAt: daysAgo(4),
        createdBy: users[0].id,
        createdAt: daysAgo(6),
      },
    }),
    prisma.trip.create({
      data: {
        source: "Kolkata Depot",
        destination: "Patna Market",
        vehicleId: vehicles[4].id,
        driverId: drivers[4].id,
        cargoWeightKg: 600,
        plannedDistanceKm: 580,
        actualDistanceKm: 595,
        fuelConsumedL: 72,
        revenue: 32000,
        status: "COMPLETED",
        dispatchedAt: daysAgo(4),
        completedAt: daysAgo(3),
        createdBy: users[0].id,
        createdAt: daysAgo(5),
      },
    }),
    prisma.trip.create({
      data: {
        source: "Ahmedabad Factory",
        destination: "Pune Outlet",
        vehicleId: vehicles[5].id,
        driverId: drivers[3].id,
        cargoWeightKg: 15000,
        plannedDistanceKm: 670,
        actualDistanceKm: 685,
        fuelConsumedL: 165,
        revenue: 48000,
        status: "COMPLETED",
        dispatchedAt: daysAgo(3),
        completedAt: daysAgo(2),
        createdBy: users[0].id,
        createdAt: daysAgo(4),
      },
    }),
    prisma.trip.create({
      data: {
        source: "Hyderabad Depot",
        destination: "Vizag Port",
        vehicleId: vehicles[7].id,
        driverId: drivers[5].id,
        cargoWeightKg: 28000,
        plannedDistanceKm: 620,
        actualDistanceKm: 640,
        fuelConsumedL: 195,
        revenue: 72000,
        status: "COMPLETED",
        dispatchedAt: daysAgo(6),
        completedAt: daysAgo(4),
        createdBy: users[0].id,
        createdAt: daysAgo(7),
      },
    }),
    // Active (DISPATCHED) trip
    prisma.trip.create({
      data: {
        source: "Delhi NCR Hub",
        destination: "Jaipur Warehouse",
        vehicleId: vehicles[1].id,
        driverId: drivers[2].id,
        cargoWeightKg: 18000,
        plannedDistanceKm: 280,
        status: "DISPATCHED",
        dispatchedAt: daysAgo(0),
        createdBy: users[0].id,
        createdAt: daysAgo(1),
      },
    }),
    // Draft trips
    prisma.trip.create({
      data: {
        source: "Lucknow Terminal",
        destination: "Kanpur Yard",
        vehicleId: vehicles[0].id,
        driverId: drivers[0].id,
        cargoWeightKg: 20000,
        plannedDistanceKm: 85,
        status: "DRAFT",
        createdBy: users[0].id,
        createdAt: daysAgo(0),
      },
    }),
    prisma.trip.create({
      data: {
        source: "Goa Port",
        destination: "Mumbai Central",
        vehicleId: vehicles[5].id,
        driverId: drivers[3].id,
        cargoWeightKg: 12000,
        plannedDistanceKm: 590,
        status: "DRAFT",
        createdBy: users[1].id,
        createdAt: daysAgo(0),
      },
    }),
    // More completed for richer data
    prisma.trip.create({
      data: {
        source: "Indore Facility",
        destination: "Bhopal Station",
        vehicleId: vehicles[5].id,
        driverId: drivers[3].id,
        cargoWeightKg: 14000,
        plannedDistanceKm: 195,
        actualDistanceKm: 200,
        fuelConsumedL: 48,
        revenue: 18000,
        status: "COMPLETED",
        dispatchedAt: daysAgo(10),
        completedAt: daysAgo(9),
        createdBy: users[0].id,
        createdAt: daysAgo(11),
      },
    }),
    prisma.trip.create({
      data: {
        source: "Surat Textile Hub",
        destination: "Rajkot Depot",
        vehicleId: vehicles[7].id,
        driverId: drivers[7].id,
        cargoWeightKg: 25000,
        plannedDistanceKm: 265,
        actualDistanceKm: 272,
        fuelConsumedL: 82,
        revenue: 35000,
        status: "COMPLETED",
        dispatchedAt: daysAgo(8),
        completedAt: daysAgo(7),
        createdBy: users[0].id,
        createdAt: daysAgo(9),
      },
    }),
    // Cancelled trip
    prisma.trip.create({
      data: {
        source: "Nagpur Warehouse",
        destination: "Raipur Center",
        vehicleId: vehicles[0].id,
        driverId: drivers[1].id,
        cargoWeightKg: 22000,
        plannedDistanceKm: 290,
        status: "CANCELLED",
        cancelledAt: daysAgo(2),
        createdBy: users[0].id,
        createdAt: daysAgo(3),
      },
    }),
  ]);

  console.log(`   ✅ Created ${trips.length} trips`);

  // ==================== FUEL LOGS ====================
  console.log("⛽ Creating fuel logs...");
  await Promise.all([
    prisma.fuelLog.create({
      data: { vehicleId: vehicles[0].id, tripId: trips[0].id, liters: 380, cost: 36100, logDate: daysAgo(5), createdBy: users[0].id },
    }),
    prisma.fuelLog.create({
      data: { vehicleId: vehicles[2].id, tripId: trips[1].id, liters: 45, cost: 4275, logDate: daysAgo(4), createdBy: users[0].id },
    }),
    prisma.fuelLog.create({
      data: { vehicleId: vehicles[4].id, tripId: trips[2].id, liters: 72, cost: 6840, logDate: daysAgo(3), createdBy: users[0].id },
    }),
    prisma.fuelLog.create({
      data: { vehicleId: vehicles[5].id, tripId: trips[3].id, liters: 165, cost: 15675, logDate: daysAgo(2), createdBy: users[0].id },
    }),
    prisma.fuelLog.create({
      data: { vehicleId: vehicles[7].id, tripId: trips[4].id, liters: 195, cost: 18525, logDate: daysAgo(4), createdBy: users[0].id },
    }),
    prisma.fuelLog.create({
      data: { vehicleId: vehicles[5].id, tripId: trips[8].id, liters: 48, cost: 4560, logDate: daysAgo(9), createdBy: users[0].id },
    }),
    prisma.fuelLog.create({
      data: { vehicleId: vehicles[7].id, tripId: trips[9].id, liters: 82, cost: 7790, logDate: daysAgo(7), createdBy: users[0].id },
    }),
  ]);
  console.log("   ✅ Created fuel logs");

  // ==================== MAINTENANCE LOGS ====================
  console.log("🔧 Creating maintenance logs...");
  await Promise.all([
    prisma.maintenanceLog.create({
      data: {
        vehicleId: vehicles[3].id,
        title: "Engine Overhaul",
        description: "Complete engine rebuild after 200k km milestone",
        cost: 125000,
        status: "OPEN",
        openedAt: daysAgo(2),
        createdBy: users[0].id,
      },
    }),
    prisma.maintenanceLog.create({
      data: {
        vehicleId: vehicles[0].id,
        title: "Tire Replacement",
        description: "Front axle tires replaced - Bridgestone R-Drive",
        cost: 48000,
        status: "CLOSED",
        openedAt: daysAgo(15),
        closedAt: daysAgo(12),
        createdBy: users[0].id,
      },
    }),
    prisma.maintenanceLog.create({
      data: {
        vehicleId: vehicles[7].id,
        title: "Brake Pad Service",
        description: "Rear brake pads and disc replacement",
        cost: 32000,
        status: "CLOSED",
        openedAt: daysAgo(20),
        closedAt: daysAgo(18),
        createdBy: users[0].id,
      },
    }),
    prisma.maintenanceLog.create({
      data: {
        vehicleId: vehicles[1].id,
        title: "Oil Change + Filter",
        description: "Routine 10k km service",
        cost: 8500,
        status: "CLOSED",
        openedAt: daysAgo(10),
        closedAt: daysAgo(10),
        createdBy: users[0].id,
      },
    }),
  ]);
  console.log("   ✅ Created maintenance logs");

  // ==================== EXPENSES ====================
  console.log("💰 Creating expenses...");
  await Promise.all([
    prisma.expense.create({
      data: { vehicleId: vehicles[0].id, tripId: trips[0].id, category: "Toll", amount: 4200, expenseDate: daysAgo(6), notes: "Mumbai-Delhi NH tolls", createdBy: users[0].id },
    }),
    prisma.expense.create({
      data: { vehicleId: vehicles[0].id, tripId: trips[0].id, category: "Parking", amount: 500, expenseDate: daysAgo(5), notes: "Overnight parking at rest stop", createdBy: users[0].id },
    }),
    prisma.expense.create({
      data: { vehicleId: vehicles[2].id, tripId: trips[1].id, category: "Toll", amount: 1800, expenseDate: daysAgo(4), createdBy: users[0].id },
    }),
    prisma.expense.create({
      data: { vehicleId: vehicles[5].id, tripId: trips[3].id, category: "Toll", amount: 2600, expenseDate: daysAgo(2), createdBy: users[0].id },
    }),
    prisma.expense.create({
      data: { category: "Misc", amount: 15000, expenseDate: daysAgo(1), notes: "Office supplies and driver safety kit", createdBy: users[3].id },
    }),
  ]);
  console.log("   ✅ Created expenses");

  // ==================== PROOF DOCUMENTS ====================
  console.log("📄 Creating proof documents...");
  await Promise.all([
    prisma.proofDocument.create({
      data: {
        submittedBy: users[1].id,
        entityType: "DRIVER",
        entityId: drivers[0].id,
        proofType: "DRIVER_LICENSE",
        fileUrl: "/uploads/license_ravi.pdf",
        status: "PENDING",
      },
    }),
    prisma.proofDocument.create({
      data: {
        submittedBy: users[0].id,
        entityType: "VEHICLE",
        entityId: vehicles[0].id,
        proofType: "INSURANCE",
        fileUrl: "/uploads/insurance_trk001.pdf",
        status: "PENDING",
      },
    }),
    prisma.proofDocument.create({
      data: {
        submittedBy: users[0].id,
        entityType: "VEHICLE",
        entityId: vehicles[2].id,
        proofType: "VEHICLE_REGISTRATION",
        fileUrl: "/uploads/registration_van003.pdf",
        status: "APPROVED",
        reviewedBy: users[4].id,
        reviewNote: "Verified against RTO records",
        reviewedAt: daysAgo(3),
      },
    }),
  ]);
  console.log("   ✅ Created proof documents");

  // ==================== DASHBOARD REQUESTS ====================
  console.log("📨 Creating dashboard requests...");
  await Promise.all([
    prisma.dashboardRequest.create({
      data: {
        requestType: "DOCUMENT_APPROVAL",
        originRole: "DRIVER",
        targetRole: "ADMIN",
        referenceTable: "proof_documents",
        referenceId: (await prisma.proofDocument.findFirst({ where: { status: "PENDING", proofType: "DRIVER_LICENSE" } }))!.id,
        message: "Driver license renewal proof submitted for review",
        status: "PENDING",
        createdBy: users[1].id,
      },
    }),
    prisma.dashboardRequest.create({
      data: {
        requestType: "DOCUMENT_APPROVAL",
        originRole: "FLEET_MANAGER",
        targetRole: "ADMIN",
        referenceTable: "proof_documents",
        referenceId: (await prisma.proofDocument.findFirst({ where: { status: "PENDING", proofType: "INSURANCE" } }))!.id,
        message: "Vehicle insurance document requires admin verification",
        status: "PENDING",
        createdBy: users[0].id,
      },
    }),
  ]);
  console.log("   ✅ Created dashboard requests");

  // ==================== NOTIFICATIONS ====================
  console.log("🔔 Creating notifications...");
  await Promise.all([
    prisma.notification.create({
      data: {
        userId: users[0].id,
        title: "Trip Completed",
        body: "Mumbai → Delhi trip by Ravi Kumar completed successfully.",
        severity: "INFO",
        createdAt: daysAgo(5),
      },
    }),
    prisma.notification.create({
      data: {
        userId: users[2].id,
        title: "⚠️ License Expiring Soon",
        body: "Suresh Yadav's license expires in 5 days. Please follow up.",
        severity: "WARNING",
      },
    }),
    prisma.notification.create({
      data: {
        userId: users[2].id,
        title: "🚨 License Expired",
        body: "Vikram Singh's license has expired. Driver has been suspended.",
        severity: "CRITICAL",
        createdAt: daysAgo(1),
      },
    }),
    prisma.notification.create({
      data: {
        userId: users[4].id,
        title: "New Document for Review",
        body: "Ravi Kumar submitted a driver license proof. Pending your approval.",
        severity: "INFO",
      },
    }),
    prisma.notification.create({
      data: {
        userId: users[4].id,
        title: "New Document for Review",
        body: "Fleet Manager submitted vehicle insurance for NF-TRK-001.",
        severity: "INFO",
      },
    }),
    prisma.notification.create({
      data: {
        userId: users[3].id,
        title: "High Fuel Cost Alert",
        body: "Vehicle NF-TRK-001 fuel cost exceeded ₹35,000 this week.",
        severity: "WARNING",
        createdAt: daysAgo(2),
      },
    }),
  ]);
  console.log("   ✅ Created notifications");

  // ==================== AUDIT LOGS ====================
  console.log("📋 Creating audit logs...");
  await Promise.all([
    prisma.auditLog.create({
      data: { actorId: users[0].id, action: "TRIP_DISPATCHED", tableName: "trips", recordId: trips[0].id, afterState: { status: "DISPATCHED" }, createdAt: daysAgo(7) },
    }),
    prisma.auditLog.create({
      data: { actorId: users[0].id, action: "TRIP_COMPLETED", tableName: "trips", recordId: trips[0].id, afterState: { status: "COMPLETED" }, createdAt: daysAgo(5) },
    }),
    prisma.auditLog.create({
      data: { actorId: users[0].id, action: "VEHICLE_REGISTERED", tableName: "vehicles", recordId: vehicles[9].id, afterState: { registrationNumber: "NF-TRK-010" }, createdAt: daysAgo(12) },
    }),
    prisma.auditLog.create({
      data: { actorId: users[2].id, action: "DRIVER_SUSPENDED", tableName: "drivers", recordId: drivers[6].id, afterState: { status: "SUSPENDED", reason: "License expired" }, createdAt: daysAgo(1) },
    }),
    prisma.auditLog.create({
      data: { actorId: users[0].id, action: "MAINTENANCE_OPENED", tableName: "maintenance_logs", recordId: vehicles[3].id, afterState: { vehicleId: vehicles[3].id, title: "Engine Overhaul" }, createdAt: daysAgo(2) },
    }),
    prisma.auditLog.create({
      data: { actorId: users[4].id, action: "PROOF_APPROVED", tableName: "proof_documents", recordId: "doc-approved", afterState: { status: "APPROVED" }, createdAt: daysAgo(3) },
    }),
  ]);
  console.log("   ✅ Created audit logs");

  console.log("\n✨ NovaFleet database seeded successfully!");
  console.log("\n📋 Demo Credentials (all use password: password123):");
  console.log("   Fleet Manager: fleet@novafleet.io");
  console.log("   Driver:        driver@novafleet.io");
  console.log("   Safety Officer: safety@novafleet.io");
  console.log("   Finance:       finance@novafleet.io");
  console.log("   Admin:         admin@novafleet.io");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
