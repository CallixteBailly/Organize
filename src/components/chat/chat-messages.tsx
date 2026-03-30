"use client";

import { useEffect, useRef } from "react";
import { Loader2, Bot, ExternalLink, Check, X } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils/cn";
import type { ChatMessage } from "@/lib/ai/chat/types";

interface ChatMessagesProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onConfirmPlan: () => void;
  onCancelPlan: () => void;
}

const markdownComponents: React.ComponentProps<typeof ReactMarkdown>["components"] = {
  p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  ul: ({ children }) => <ul className="list-disc list-inside mb-1 space-y-0.5">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal list-inside mb-1 space-y-0.5">{children}</ol>,
  li: ({ children }) => <li>{children}</li>,
  h1: ({ children }) => <p className="font-semibold mb-1">{children}</p>,
  h2: ({ children }) => <p className="font-semibold mb-1">{children}</p>,
  h3: ({ children }) => <p className="font-medium mb-0.5">{children}</p>,
  code: ({ children }) => (
    <code className="rounded bg-black/10 px-1 py-0.5 font-mono text-xs">{children}</code>
  ),
  table: ({ children }) => (
    <div className="my-2 overflow-x-auto rounded border border-border/30">
      <table className="w-full text-xs border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-muted/50">{children}</thead>,
  th: ({ children }) => (
    <th className="border-b border-border/30 px-2 py-1.5 text-left font-semibold">{children}</th>
  ),
  td: ({ children }) => (
    <td className="border-b border-border/20 px-2 py-1.5">{children}</td>
  ),
};

export function ChatMessages({
  messages,
  isLoading,
  onConfirmPlan,
  onCancelPlan,
}: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
        <Bot className="h-10 w-10 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">
          Posez une question, créez un client, cherchez une intervention…
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-3" aria-live="polite">
      {messages.map((msg, i) => (
        <div
          key={i}
          className={cn(
            "flex max-w-[85%] flex-col gap-1",
            msg.role === "human" ? "self-end items-end" : "self-start items-start",
          )}
        >
          <div
            className={cn(
              "rounded-2xl px-3 py-2 text-sm leading-relaxed",
              msg.role === "human"
                ? "rounded-br-sm bg-primary text-primary-foreground"
                : "rounded-bl-sm bg-muted text-foreground",
            )}
          >
            {msg.role === "assistant" ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {msg.content}
              </ReactMarkdown>
            ) : (
              msg.content
            )}
          </div>

          {/* Boutons Confirmer / Annuler pour les plans en attente */}
          {msg.pendingPlan && (
            <div className="mt-1 flex gap-2">
              <button
                onClick={onConfirmPlan}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full",
                  "bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground",
                  "transition-colors hover:bg-primary/90",
                )}
              >
                <Check className="h-3 w-3" />
                Confirmer
              </button>
              <button
                onClick={onCancelPlan}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border border-border",
                  "bg-background px-3 py-1.5 text-xs font-medium text-foreground",
                  "transition-colors hover:bg-muted",
                )}
              >
                <X className="h-3 w-3" />
                Annuler
              </button>
            </div>
          )}

          {/* Liens de navigation attachés au message (persistants) */}
          {msg.role === "assistant" && msg.links && msg.links.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-2">
              {msg.links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5",
                    "px-3 py-1 text-xs font-medium text-primary",
                    "transition-colors hover:bg-primary/10",
                  )}
                >
                  <ExternalLink className="h-3 w-3" />
                  {link.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}

      {isLoading && (
        <div className="flex self-start items-center gap-2 rounded-2xl rounded-bl-sm bg-muted px-3 py-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Réflexion en cours…</span>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
