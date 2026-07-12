import NextAuth from "next-auth";
import { authConfig } from "../auth.config";

const { auth } = NextAuth(authConfig);
import { NextResponse } from "next/server";

const roleHome: Record<string, string> = {
  FLEET_MANAGER: "/dashboard/fleet",
  DRIVER: "/dashboard/driver",
  SAFETY_OFFICER: "/dashboard/safety",
  FINANCIAL_ANALYST: "/dashboard/finance",
  ADMIN: "/dashboard/admin",
};

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const path = req.nextUrl.pathname;

  // Redirect unauthenticated users to login
  if (!isLoggedIn && path.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Role-based route protection
  if (isLoggedIn && path.startsWith("/dashboard")) {
    const userRole = req.auth?.user?.role;
    if (!userRole) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Check if user is accessing another role's dashboard
    const pathSegments = path.split("/");
    const dashboardType = pathSegments[2]; // e.g., "fleet", "driver", "safety", "finance", "admin"

    const rolePathMap: Record<string, string[]> = {
      FLEET_MANAGER: ["fleet"],
      DRIVER: ["driver"],
      SAFETY_OFFICER: ["safety"],
      FINANCIAL_ANALYST: ["finance", "reports"],
      ADMIN: ["admin", "fleet", "driver", "safety", "finance", "reports"], // Admin can access all
    };

    const allowedPaths = rolePathMap[userRole] || [];
    if (dashboardType && !allowedPaths.includes(dashboardType)) {
      return NextResponse.redirect(new URL(roleHome[userRole], req.url));
    }
  }

  // Redirect root to dashboard or login
  if (path === "/") {
    if (isLoggedIn && req.auth?.user?.role) {
      return NextResponse.redirect(
        new URL(roleHome[req.auth.user.role], req.url)
      );
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/", "/dashboard/:path*"],
};
