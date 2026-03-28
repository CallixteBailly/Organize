"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils/cn";
import { mainNavItems } from "@/lib/constants/navigation";
import { hasPermission, type UserRole } from "@/lib/constants/roles";
import { Wrench } from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user?.role ?? "mechanic") as UserRole;

  const visibleItems = mainNavItems.filter(
    (item) => !item.permission || hasPermission(role, item.permission),
  );

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-border lg:bg-card">
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <Wrench className="h-6 w-6 text-primary" />
        <span className="text-lg font-bold text-foreground">Organize</span>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-[var(--radius)] px-3 py-3 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
