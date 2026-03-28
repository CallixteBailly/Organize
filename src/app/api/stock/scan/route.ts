import { NextRequest, NextResponse } from "next/server";
import { withAuth, type AuthContext } from "@/server/middleware/with-auth";
import { getStockItemByBarcode } from "@/server/services/stock.service";

async function handler(req: NextRequest, ctx: AuthContext) {
  const barcode = req.nextUrl.searchParams.get("barcode");
  if (!barcode) {
    return NextResponse.json({ error: "Code-barres requis" }, { status: 400 });
  }

  const item = await getStockItemByBarcode(ctx.garageId, barcode);
  if (!item) {
    return NextResponse.json({ error: "Article non trouve" }, { status: 404 });
  }

  return NextResponse.json(item);
}

export const GET = withAuth(handler);
