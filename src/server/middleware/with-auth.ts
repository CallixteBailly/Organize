import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import type { UserRole } from "@/lib/constants/roles";

export interface AuthContext {
  userId: string;
  garageId: string;
  role: UserRole;
}

type AuthenticatedHandler = (
  req: NextRequest,
  context: AuthContext,
) => Promise<NextResponse> | NextResponse;

export function withAuth(handler: AuthenticatedHandler, options?: { roles?: UserRole[] }) {
  return async (req: NextRequest) => {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    if (options?.roles && !options.roles.includes(session.user.role)) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const ctx: AuthContext = {
      userId: session.user.id,
      garageId: session.user.garageId,
      role: session.user.role,
    };

    return handler(req, ctx);
  };
}
