"use client";

import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut, User, Wrench } from "lucide-react";
import { NotificationBell } from "./notification-bell";

export function Topbar() {
  const { data: session } = useSession();

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4 lg:px-6">
      <div className="flex items-center gap-2.5 lg:hidden">
        <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius)] bg-primary">
          <Wrench className="h-4 w-4 text-primary-foreground" aria-hidden="true" />
        </div>
        <span className="text-lg font-bold tracking-tight text-foreground">Organize</span>
      </div>
      <div className="hidden lg:block" />
      <div className="flex items-center gap-2">
        {session?.user && (
          <>
            <NotificationBell />
            <div className="hidden items-center gap-2.5 sm:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/8 ring-1 ring-primary/20">
                <User className="h-4 w-4 text-primary" aria-hidden="true" />
              </div>
              <span className="text-sm font-medium text-foreground">{session.user.name}</span>
            </div>
            <div className="mx-1 hidden h-5 w-px bg-border sm:block" role="separator" />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => signOut({ callbackUrl: "/login" })}
              aria-label="Se deconnecter"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
