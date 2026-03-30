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
      <div className="flex h-14 items-center gap-2.5 border-b border-border px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius)] bg-primary">
          <Wrench className="h-4 w-4 text-primary-foreground" aria-hidden="true" />
        </div>
        <span className="text-lg font-bold tracking-tight text-foreground">Organize</span>
      </div>
      <nav aria-label="Navigation principale" className="flex-1 space-y-0.5 p-3">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-[var(--radius)] px-3 py-2.5 text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-primary/8 text-primary shadow-[var(--shadow-xs)]"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
