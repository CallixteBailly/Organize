"use client";

import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut, User, Wrench } from "lucide-react";

export function Topbar() {
  const { data: session } = useSession();

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 lg:px-6">
      <div className="flex items-center gap-2 lg:hidden">
        <Wrench className="h-6 w-6 text-primary" />
        <span className="text-lg font-bold text-foreground">Organize</span>
      </div>
      <div className="hidden lg:block" />
      <div className="flex items-center gap-3">
        {session?.user && (
          <>
            <div className="hidden items-center gap-2 sm:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <User className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm font-medium text-foreground">{session.user.name}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => signOut({ callbackUrl: "/login" })}
              aria-label="Se deconnecter"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
