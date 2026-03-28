import { NextRequest, NextResponse } from "next/server";
import { withAuth, type AuthContext } from "@/server/middleware/with-auth";
import { comparePricesForItem } from "@/server/services/supplier.service";

async function handler(req: NextRequest, ctx: AuthContext) {
  const stockItemId = req.nextUrl.searchParams.get("stockItemId");
  if (!stockItemId) {
    return NextResponse.json({ error: "stockItemId requis" }, { status: 400 });
  }

  const offers = await comparePricesForItem(ctx.garageId, stockItemId);
  return NextResponse.json(offers);
}

export const GET = withAuth(handler);
