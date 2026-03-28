import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { eq, and } from "drizzle-orm";
import bcryptjs from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import type { UserRole } from "@/lib/constants/roles";

declare module "next-auth" {
  interface User {
    garageId: string;
    role: UserRole;
  }

  interface Session {
    user: {
      id: string;
      garageId: string;
      role: UserRole;
      email: string;
      name: string;
    };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email as string;
        const password = credentials.password as string;

        const [user] = await db
          .select()
          .from(users)
          .where(and(eq(users.email, email), eq(users.isActive, true)))
          .limit(1);

        if (!user || !user.passwordHash) return null;

        const isValid = await bcryptjs.compare(password, user.passwordHash);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          garageId: user.garageId,
          role: user.role as UserRole,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        (token as Record<string, unknown>).userId = user.id!;
        (token as Record<string, unknown>).garageId = user.garageId;
        (token as Record<string, unknown>).role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      const t = token as Record<string, unknown>;
      session.user.id = t.userId as string;
      session.user.garageId = t.garageId as string;
      session.user.role = t.role as UserRole;
      return session;
    },
  },
});
