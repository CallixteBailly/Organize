"use client";

import { useRef } from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled: boolean;
}

export function ChatInput({ value, onChange, onSubmit, disabled }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (!disabled && value.trim()) onSubmit();
    }
  }

  return (
    <div className="flex items-end gap-2 border-t border-border px-4 py-3">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Demandez quelque chose…"
        rows={1}
        disabled={disabled}
        className={cn(
          "flex-1 resize-none rounded-xl border border-border bg-background",
          "px-3 py-2 text-sm placeholder:text-muted-foreground",
          "focus:outline-none focus:ring-2 focus:ring-ring",
          "disabled:opacity-50",
          "max-h-32 overflow-y-auto",
        )}
        style={{ height: "auto" }}
        onInput={(e) => {
          const el = e.currentTarget;
          el.style.height = "auto";
          el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
        }}
        aria-label="Message pour l'assistant"
      />
      <button
        onClick={onSubmit}
        disabled={disabled || !value.trim()}
        aria-label="Envoyer"
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          "bg-primary text-primary-foreground",
          "transition-colors hover:bg-primary/90",
          "disabled:pointer-events-none disabled:opacity-50",
          "active:scale-[0.98]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )}
      >
        <Send className="h-4 w-4" />
      </button>
    </div>
  );
}
