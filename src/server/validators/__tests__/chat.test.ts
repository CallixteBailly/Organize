import { describe, it, expect } from "vitest";
import { chatRequestSchema, pageContextSchema } from "../chat";

describe("pageContextSchema", () => {
  it("accepte une route simple", () => {
    const result = pageContextSchema.safeParse({ route: "/dashboard" });
    expect(result.success).toBe(true);
  });

  it("accepte un contexte complet avec entityType et entityId", () => {
    const result = pageContextSchema.safeParse({
      route: "/repair-orders/abc",
      entityType: "repair_order",
      entityId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
  });

  it("rejette un entityType invalide", () => {
    const result = pageContextSchema.safeParse({
      route: "/foo",
      entityType: "unknown_type",
    });
    expect(result.success).toBe(false);
  });

  it("rejette un entityId qui n'est pas un UUID", () => {
    const result = pageContextSchema.safeParse({
      route: "/foo",
      entityType: "customer",
      entityId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("rejette une route trop longue", () => {
    const result = pageContextSchema.safeParse({ route: "a".repeat(201) });
    expect(result.success).toBe(false);
  });
});

describe("chatRequestSchema", () => {
  it("accepte une requête minimale valide", () => {
    const result = chatRequestSchema.safeParse({
      messages: [{ role: "human", content: "Bonjour" }],
    });
    expect(result.success).toBe(true);
  });

  it("accepte confirmedPlan = true", () => {
    const result = chatRequestSchema.safeParse({
      messages: [{ role: "human", content: "Confirmer" }],
      confirmedPlan: true,
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.confirmedPlan).toBe(true);
  });

  it("accepte confirmedPlan absent (undefined)", () => {
    const result = chatRequestSchema.safeParse({
      messages: [{ role: "human", content: "test" }],
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.confirmedPlan).toBeUndefined();
  });

  it("accepte des messages alternés human/assistant", () => {
    const result = chatRequestSchema.safeParse({
      messages: [
        { role: "human", content: "Crée un client" },
        { role: "assistant", content: "Je vais créer..." },
        { role: "human", content: "Confirmer" },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejette un message avec contenu vide", () => {
    const result = chatRequestSchema.safeParse({
      messages: [{ role: "human", content: "" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejette un rôle de message invalide", () => {
    const result = chatRequestSchema.safeParse({
      messages: [{ role: "system", content: "test" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejette un tableau de messages vide", () => {
    const result = chatRequestSchema.safeParse({ messages: [] });
    expect(result.success).toBe(false);
  });

  it("accepte pageContext optionnel", () => {
    const result = chatRequestSchema.safeParse({
      messages: [{ role: "human", content: "test" }],
      pageContext: { route: "/customers" },
    });
    expect(result.success).toBe(true);
  });
});
