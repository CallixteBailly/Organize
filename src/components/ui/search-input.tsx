"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export const SearchInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          className={cn(
            "flex h-12 w-full rounded-[var(--radius)] border border-input bg-background pl-10 pr-3 py-2 text-base",
            "placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            className,
          )}
          ref={ref}
          {...props}
        />
      </div>
    );
  },
);
SearchInput.displayName = "SearchInput";
