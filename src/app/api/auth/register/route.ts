import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fullName, email, password, role, region } = body;

    // 1. Basic validation
    if (!fullName || !email || !password || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 2. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists." },
        { status: 409 }
      );
    }

    // 3. Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Enforce safe roles (prevent privilege escalation)
    const safeRoles = ["DRIVER", "FLEET_MANAGER", "SAFETY_OFFICER", "FINANCIAL_ANALYST", "ADMIN"];
    const finalRole = safeRoles.includes(role) ? role : "DRIVER";

    // 4. Create user in DB
    const newUser = await prisma.user.create({
      data: {
        fullName,
        email,
        passwordHash,
        role: finalRole as UserRole,
        region: region || "NA",
        isActive: true, // Default to true so they can login immediately
      },
    });

    // 5. Exclude passwordHash from response
    const { passwordHash: _, ...userWithoutPassword } = newUser;

    return NextResponse.json(
      { message: "User registered successfully", user: userWithoutPassword },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Something went wrong during registration." },
      { status: 500 }
    );
  }
}
