import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { garages } from "@/lib/db/schema";
import type { UpdateGarageInput } from "@/server/validators/garage";

export async function getGarage(garageId: string) {
  const [garage] = await db.select().from(garages).where(eq(garages.id, garageId)).limit(1);
  return garage ?? null;
}

export async function updateGarage(garageId: string, data: UpdateGarageInput) {
  const [updated] = await db
    .update(garages)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(garages.id, garageId))
    .returning();
  return updated;
}
