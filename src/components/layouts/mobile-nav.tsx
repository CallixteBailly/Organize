"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils/cn";
import { mainNavItems } from "@/lib/constants/navigation";
import { hasPermission, type UserRole } from "@/lib/constants/roles";

export function MobileNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user?.role ?? "mechanic") as UserRole;

  const mobileItems = mainNavItems
    .filter((item) => item.mobileVisible && (!item.permission || hasPermission(role, item.permission)))
    .slice(0, 5);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] lg:hidden">
      <div className="flex items-center justify-around">
        {mobileItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-3 text-xs font-medium transition-colors",
                "min-h-[56px] min-w-[56px]",
                isActive ? "text-primary" : "text-muted-foreground",
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
