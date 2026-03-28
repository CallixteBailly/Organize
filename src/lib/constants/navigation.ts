import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  FileText,
  Wrench,
  Users,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { hasPermission, type UserRole, type Permission } from "./roles";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  permission?: Permission;
  mobileVisible: boolean;
}

export const mainNavItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    permission: "dashboard:view",
    mobileVisible: true,
  },
  {
    label: "Stock",
    href: "/stock",
    icon: Package,
    permission: "stock:view",
    mobileVisible: true,
  },
  {
    label: "Commandes",
    href: "/orders",
    icon: ShoppingCart,
    permission: "orders:create",
    mobileVisible: true,
  },
  {
    label: "Interventions",
    href: "/repair-orders",
    icon: Wrench,
    permission: "repair-orders:view",
    mobileVisible: true,
  },
  {
    label: "Factures",
    href: "/invoices",
    icon: FileText,
    permission: "invoices:view",
    mobileVisible: true,
  },
  {
    label: "Clients",
    href: "/customers",
    icon: Users,
    permission: "customers:view",
    mobileVisible: false,
  },
  {
    label: "Parametres",
    href: "/settings",
    icon: Settings,
    permission: "settings:garage",
    mobileVisible: false,
  },
];

export function getNavItemsForRole(role: UserRole): NavItem[] {
  return mainNavItems.filter((item) => !item.permission || hasPermission(role, item.permission));
}

export function getMobileNavItems(role: UserRole): NavItem[] {
  return getNavItemsForRole(role).filter((item) => item.mobileVisible);
}
