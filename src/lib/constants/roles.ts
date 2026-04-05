export const UserRoles = ["owner", "manager", "mechanic", "secretary"] as const;
export type UserRole = (typeof UserRoles)[number];

export type Permission =
  | "dashboard:view"
  | "stock:view"
  | "stock:edit"
  | "stock:movement"
  | "orders:create"
  | "orders:manage"
  | "invoices:view"
  | "invoices:create"
  | "invoices:finalize"
  | "repair-orders:view"
  | "repair-orders:edit"
  | "quotes:view"
  | "quotes:edit"
  | "customers:view"
  | "customers:edit"
  | "settings:garage"
  | "settings:users"
  | "accounting:export"
  | "catalog:view"
  | "activity:view";

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  owner: [
    "dashboard:view",
    "stock:view",
    "stock:edit",
    "stock:movement",
    "orders:create",
    "orders:manage",
    "invoices:view",
    "invoices:create",
    "invoices:finalize",
    "repair-orders:view",
    "repair-orders:edit",
    "quotes:view",
    "quotes:edit",
    "customers:view",
    "customers:edit",
    "settings:garage",
    "settings:users",
    "accounting:export",
    "catalog:view",
    "activity:view",
  ],
  manager: [
    "dashboard:view",
    "stock:view",
    "stock:edit",
    "stock:movement",
    "orders:create",
    "orders:manage",
    "invoices:view",
    "invoices:create",
    "invoices:finalize",
    "repair-orders:view",
    "repair-orders:edit",
    "quotes:view",
    "quotes:edit",
    "customers:view",
    "customers:edit",
    "accounting:export",
    "catalog:view",
    "activity:view",
  ],
  mechanic: [
    "stock:view",
    "stock:movement",
    "orders:create",
    "repair-orders:view",
    "repair-orders:edit",
    "customers:view",
    "customers:edit",
    "catalog:view",
  ],
  secretary: [
    "stock:view",
    "stock:edit",
    "stock:movement",
    "orders:create",
    "orders:manage",
    "invoices:view",
    "invoices:create",
    "repair-orders:view",
    "repair-orders:edit",
    "quotes:view",
    "quotes:edit",
    "customers:view",
    "customers:edit",
    "catalog:view",
  ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function getPermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}
