import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/requireRole";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    // Authenticate user & get their role
    const user = await requireRole("FLEET_MANAGER", "DRIVER", "SAFETY_OFFICER", "FINANCIAL_ANALYST", "ADMIN");
    const { message, contextPath } = await req.json();

    // Prepare contextual data based on role
    let contextData = {};
    
    if (user.role === "FLEET_MANAGER" || user.role === "ADMIN") {
      const activeTrips = await prisma.trip.count({ where: { status: "DISPATCHED" } });
      const availableVehicles = await prisma.vehicle.count({ where: { status: "AVAILABLE" } });
      const allDrivers = await prisma.driver.findMany({
        select: { fullName: true, status: true, safetyScore: true, licenseExpiryDate: true }
      });
      contextData = { 
        activeTrips, 
        availableVehicles, 
        driversOverview: allDrivers, 
        focus: "Dispatch, fleet operations, and complete driver analysis" 
      };
    } else if (user.role === "DRIVER") {
      const myTrips = await prisma.trip.count({ where: { driverId: user.id } });
      contextData = { myTrips, focus: "Personal driver tasks and open trips" };
    } else if (user.role === "SAFETY_OFFICER") {
      const pendingProofs = await prisma.proofDocument.count({ where: { status: "PENDING" } });
      contextData = { pendingProofs, focus: "Driver compliance and safety" };
    } else if (user.role === "FINANCIAL_ANALYST") {
      contextData = { focus: "Cost, revenue, and ROI" };
    }

    // Call Groq API
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content: `You are Nova, the AI assistant for NovaFleet. The user is a ${user.role}. 
            Context data: ${JSON.stringify(contextData)}. 
            User is currently on path: ${contextPath}.
            Keep your answers concise, professional, and cosmic-themed. 
            If they ask to generate a report, PDF, or graph, you can output a special command tag like [GENERATE_PDF] or [SHOW_GRAPH] which the UI will intercept.
            Do not invent numbers. Use the context data provided.`
          },
          {
            role: "user",
            content: message
          }
        ],
        max_tokens: 500
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to communicate with Groq");
    }

    return NextResponse.json({ reply: data.choices[0].message.content });

  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
