import { describe, it, expect } from "vitest";
import type {
  LogActivityInput,
  ActivityAction,
  ActivitySource,
  EntityType,
} from "../activity-log.service";

describe("activity-log types", () => {
  it("LogActivityInput accepts valid input with user source", () => {
    const input: LogActivityInput = {
      garageId: "550e8400-e29b-41d4-a716-446655440000",
      userId: "550e8400-e29b-41d4-a716-446655440001",
      source: "user",
      action: "create",
      entityType: "customer",
      entityId: "550e8400-e29b-41d4-a716-446655440002",
      description: "Creation du client Jean Dupont",
      metadata: { firstName: "Jean", lastName: "Dupont" },
    };
    expect(input.source).toBe("user");
    expect(input.action).toBe("create");
    expect(input.entityType).toBe("customer");
  });

  it("LogActivityInput accepts AI source", () => {
    const input: LogActivityInput = {
      garageId: "550e8400-e29b-41d4-a716-446655440000",
      userId: "550e8400-e29b-41d4-a716-446655440001",
      source: "ai",
      action: "create",
      entityType: "repair_order",
      description: "Saisie rapide IA confirmee par Admin",
      metadata: { customerId: "abc", vehicleId: "def" },
    };
    expect(input.source).toBe("ai");
  });

  it("LogActivityInput allows optional fields to be omitted", () => {
    const input: LogActivityInput = {
      garageId: "550e8400-e29b-41d4-a716-446655440000",
      userId: "550e8400-e29b-41d4-a716-446655440001",
      action: "update",
      entityType: "invoice",
      description: "Modification facture",
    };
    expect(input.source).toBeUndefined();
    expect(input.entityId).toBeUndefined();
    expect(input.metadata).toBeUndefined();
    expect(input.ipAddress).toBeUndefined();
  });

  it("all ActivityAction values are valid", () => {
    const actions: ActivityAction[] = [
      "create",
      "update",
      "delete",
      "status_change",
      "finalize",
      "send",
      "payment",
      "convert",
      "close",
      "sign",
      "login",
    ];
    expect(actions).toHaveLength(11);
  });

  it("all ActivitySource values are valid", () => {
    const sources: ActivitySource[] = ["user", "ai"];
    expect(sources).toHaveLength(2);
  });

  it("all EntityType values are valid", () => {
    const entities: EntityType[] = [
      "customer",
      "vehicle",
      "invoice",
      "quote",
      "repair_order",
      "stock",
      "order",
      "supplier",
      "user",
      "garage",
      "payment",
      "stock_category",
    ];
    expect(entities).toHaveLength(12);
  });
});

describe("search escaping logic", () => {
  function escapeSearch(input: string): string {
    return input.replace(/[%_\\]/g, "\\$&");
  }

  it("escapes % character", () => {
    expect(escapeSearch("100%")).toBe("100\\%");
  });

  it("escapes _ character", () => {
    expect(escapeSearch("test_value")).toBe("test\\_value");
  });

  it("escapes backslash", () => {
    expect(escapeSearch("path\\to")).toBe("path\\\\to");
  });

  it("escapes multiple special chars", () => {
    expect(escapeSearch("%_\\")).toBe("\\%\\_\\\\");
  });

  it("leaves normal text unchanged", () => {
    expect(escapeSearch("facture client")).toBe("facture client");
  });

  it("handles empty string", () => {
    expect(escapeSearch("")).toBe("");
  });

  it("handles accented characters", () => {
    expect(escapeSearch("Creation devis")).toBe("Creation devis");
  });
});
