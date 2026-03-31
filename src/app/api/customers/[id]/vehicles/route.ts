import { NextRequest, NextResponse } from "next/server";
import { withAuth, type AuthContext } from "@/server/middleware/with-auth";
import { getVehiclesByCustomer } from "@/server/services/vehicle.service";

async function handler(req: NextRequest, ctx: AuthContext) {
  const url = new URL(req.url);
  const segments = url.pathname.split("/");
  const customerId = segments[segments.indexOf("customers") + 1];

  const vehicles = await getVehiclesByCustomer(ctx.garageId, customerId);

  return NextResponse.json(
    vehicles.map((v) => ({
      id: v.id,
      licensePlate: v.licensePlate,
      brand: v.brand,
      model: v.model,
    })),
  );
}

export const GET = withAuth(handler);
