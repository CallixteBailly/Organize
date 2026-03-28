import { describe, it, expect } from "vitest";
import { hasPermission, getPermissions, type UserRole } from "../roles";

describe("hasPermission", () => {
  it("owner has all permissions", () => {
    expect(hasPermission("owner", "dashboard:view")).toBe(true);
    expect(hasPermission("owner", "settings:users")).toBe(true);
    expect(hasPermission("owner", "invoices:finalize")).toBe(true);
    expect(hasPermission("owner", "accounting:export")).toBe(true);
  });

  it("manager has all permissions", () => {
    expect(hasPermission("manager", "dashboard:view")).toBe(true);
    expect(hasPermission("manager", "invoices:finalize")).toBe(true);
    expect(hasPermission("manager", "settings:garage")).toBe(true);
  });

  it("mechanic has limited permissions", () => {
    expect(hasPermission("mechanic", "stock:view")).toBe(true);
    expect(hasPermission("mechanic", "stock:movement")).toBe(true);
    expect(hasPermission("mechanic", "orders:create")).toBe(true);
    expect(hasPermission("mechanic", "repair-orders:view")).toBe(true);
    expect(hasPermission("mechanic", "repair-orders:edit")).toBe(true);

    // Should NOT have
    expect(hasPermission("mechanic", "dashboard:view")).toBe(false);
    expect(hasPermission("mechanic", "invoices:view")).toBe(false);
    expect(hasPermission("mechanic", "invoices:create")).toBe(false);
    expect(hasPermission("mechanic", "invoices:finalize")).toBe(false);
    expect(hasPermission("mechanic", "settings:garage")).toBe(false);
    expect(hasPermission("mechanic", "settings:users")).toBe(false);
    expect(hasPermission("mechanic", "stock:edit")).toBe(false);
    expect(hasPermission("mechanic", "accounting:export")).toBe(false);
  });

  it("secretary has invoicing but not finalization", () => {
    expect(hasPermission("secretary", "invoices:view")).toBe(true);
    expect(hasPermission("secretary", "invoices:create")).toBe(true);
    expect(hasPermission("secretary", "invoices:finalize")).toBe(false);
    expect(hasPermission("secretary", "dashboard:view")).toBe(false);
    expect(hasPermission("secretary", "settings:garage")).toBe(false);
  });
});

describe("getPermissions", () => {
  it("returns array for valid role", () => {
    const perms = getPermissions("mechanic");
    expect(Array.isArray(perms)).toBe(true);
    expect(perms.length).toBeGreaterThan(0);
  });

  it("owner has more permissions than mechanic", () => {
    const ownerPerms = getPermissions("owner");
    const mechanicPerms = getPermissions("mechanic");
    expect(ownerPerms.length).toBeGreaterThan(mechanicPerms.length);
  });

  it("returns empty for invalid role", () => {
    const perms = getPermissions("invalid" as UserRole);
    expect(perms).toEqual([]);
  });
});
