import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  session: { strategy: "jwt" },
  providers: [], // We'll add the credentials provider in auth.ts
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.role = (user as any).role;
        token.region = (user as any).region;
        token.id = user.id as string;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session?.user) {
        session.user.role = token.role as string;
        session.user.region = token.region as string;
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  trustHost: process.env.NODE_ENV === "development",
} satisfies NextAuthConfig;
