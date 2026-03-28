import { NextRequest, NextResponse } from "next/server";
import { withAuth, type AuthContext } from "@/server/middleware/with-auth";
import { generateFECExport } from "@/server/services/invoice.service";

async function handler(req: NextRequest, ctx: AuthContext) {
  if (!["owner", "manager"].includes(ctx.role)) {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  const startDate = req.nextUrl.searchParams.get("start");
  const endDate = req.nextUrl.searchParams.get("end");

  const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
  const end = endDate ? new Date(endDate) : new Date();

  const fecContent = await generateFECExport(ctx.garageId, start, end);

  return new NextResponse(fecContent, {
    headers: {
      "Content-Type": "text/tab-separated-values; charset=utf-8",
      "Content-Disposition": `attachment; filename="FEC_${start.getFullYear()}.txt"`,
    },
  });
}

export const GET = withAuth(handler);
