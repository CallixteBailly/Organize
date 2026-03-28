import { NextRequest, NextResponse } from "next/server";
import { withAuth, type AuthContext } from "@/server/middleware/with-auth";
import { getRevenueByDay } from "@/server/services/dashboard.service";

async function handler(req: NextRequest, ctx: AuthContext) {
  if (!["owner", "manager"].includes(ctx.role)) {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  const days = Number(req.nextUrl.searchParams.get("days") ?? "30");
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const data = await getRevenueByDay(ctx.garageId, startDate, new Date());
  return NextResponse.json(data);
}

export const GET = withAuth(handler);
