import { NextRequest, NextResponse } from "next/server";
import { withAuth, type AuthContext } from "@/server/middleware/with-auth";
import { searchCustomers } from "@/server/services/customer.service";

async function handler(req: NextRequest, ctx: AuthContext) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q || q.length < 1) {
    return NextResponse.json([]);
  }

  const results = await searchCustomers(ctx.garageId, q);
  return NextResponse.json(results);
}

export const GET = withAuth(handler);
