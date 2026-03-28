import { NextRequest, NextResponse } from "next/server";
import { withAuth, type AuthContext } from "@/server/middleware/with-auth";
import { getDashboardKPIs } from "@/server/services/dashboard.service";

async function handler(req: NextRequest, ctx: AuthContext) {
  if (!["owner", "manager"].includes(ctx.role)) {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  const kpis = await getDashboardKPIs(ctx.garageId);
  return NextResponse.json(kpis);
}

export const GET = withAuth(handler);
