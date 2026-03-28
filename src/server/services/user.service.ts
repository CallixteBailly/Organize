import { eq, and } from "drizzle-orm";
import bcryptjs from "bcryptjs";
import { db } from "@/lib/db";
import { users, garages } from "@/lib/db/schema";
import type { RegisterInput, CreateUserInput, UpdateUserInput } from "@/server/validators/user";

export async function registerGarageAndOwner(data: RegisterInput) {
  const passwordHash = await bcryptjs.hash(data.password, 12);

  return db.transaction(async (tx) => {
    const [garage] = await tx
      .insert(garages)
      .values({
        name: data.garageName,
        siret: data.siret,
        address: data.address,
        city: data.city,
        postalCode: data.postalCode,
      })
      .returning();

    const [user] = await tx
      .insert(users)
      .values({
        garageId: garage.id,
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        role: "owner",
      })
      .returning();

    return { garage, user };
  });
}

export async function getUsersByGarage(garageId: string) {
  return db.select().from(users).where(eq(users.garageId, garageId)).orderBy(users.lastName);
}

export async function getUserById(garageId: string, userId: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.id, userId), eq(users.garageId, garageId)))
    .limit(1);
  return user ?? null;
}

export async function createUser(garageId: string, data: CreateUserInput) {
  const passwordHash = await bcryptjs.hash(data.password, 12);

  const [user] = await db
    .insert(users)
    .values({
      garageId,
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      phone: data.phone,
    })
    .returning();

  return user;
}

export async function updateUser(garageId: string, userId: string, data: UpdateUserInput) {
  const [updated] = await db
    .update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(users.id, userId), eq(users.garageId, garageId)))
    .returning();
  return updated;
}

export async function deactivateUser(garageId: string, userId: string) {
  const [updated] = await db
    .update(users)
    .set({ isActive: false, updatedAt: new Date() })
    .where(and(eq(users.id, userId), eq(users.garageId, garageId)))
    .returning();
  return updated;
}
