"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { MoreHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { mainNavItems } from "@/lib/constants/navigation";
import { hasPermission, type UserRole } from "@/lib/constants/roles";

export function MobileNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user?.role ?? "mechanic") as UserRole;
  const [moreOpen, setMoreOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const allItems = mainNavItems.filter(
    (item) => !item.permission || hasPermission(role, item.permission),
  );

  // 4 items visibles en barre + bouton "Plus"
  const visibleItems = allItems.filter((item) => item.mobileVisible).slice(0, 4);
  const moreItems = allItems.filter((item) => !visibleItems.includes(item));

  // Une section "more" est active si le pathname correspond
  const moreIsActive = moreItems.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/"),
  );

  // Fermer le menu quand on navigue
  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  // Fermer le menu sur clic exterieur
  useEffect(() => {
    if (!moreOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [moreOpen]);

  // Fermer sur Escape
  useEffect(() => {
    if (!moreOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMoreOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [moreOpen]);

  return (
    <nav
      aria-label="Navigation mobile"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-sm pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      {/* Menu "Plus" */}
      {moreOpen && moreItems.length > 0 && (
        <div
          ref={menuRef}
          role="menu"
          aria-label="Sections supplementaires"
          className="absolute bottom-full left-0 right-0 border-t border-border bg-card/95 backdrop-blur-sm shadow-[var(--shadow-md)]"
        >
          <div className="grid grid-cols-3 gap-1 p-3">
            {moreItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  role="menuitem"
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-[var(--radius)] px-3 py-3 text-xs font-medium transition-colors",
                    isActive
                      ? "bg-primary/8 text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Barre de navigation */}
      <div className="flex items-center justify-around">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative flex flex-col items-center gap-0.5 px-3 py-2.5 text-[11px] font-medium transition-colors",
                "min-h-[52px] min-w-[52px]",
                isActive ? "text-primary" : "text-muted-foreground",
              )}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-primary" aria-hidden="true" />
              )}
              <item.icon className="h-5 w-5" aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* Bouton Plus */}
        {moreItems.length > 0 && (
          <button
            onClick={() => setMoreOpen((v) => !v)}
            aria-expanded={moreOpen}
            aria-haspopup="menu"
            aria-label={moreOpen ? "Fermer le menu" : "Plus de sections"}
            className={cn(
              "relative flex flex-col items-center gap-0.5 px-3 py-2.5 text-[11px] font-medium transition-colors",
              "min-h-[52px] min-w-[52px]",
              moreOpen || moreIsActive ? "text-primary" : "text-muted-foreground",
            )}
          >
            {moreIsActive && !moreOpen && (
              <span className="absolute top-0 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-primary" aria-hidden="true" />
            )}
            {moreOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
            )}
            <span>Plus</span>
          </button>
        )}
      </div>
    </nav>
  );
}
