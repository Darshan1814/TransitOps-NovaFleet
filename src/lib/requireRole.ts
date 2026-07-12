import { auth } from "../../auth";

export async function requireRole(...allowed: string[]) {
  const session = await auth();
  if (!session || !allowed.includes(session.user.role)) {
    throw new Error("Forbidden: insufficient role");
  }
  return session.user;
}

export async function getSessionUser() {
  const session = await auth();
  if (!session) {
    throw new Error("Unauthorized: not logged in");
  }
  return session.user;
}
