"use client";

import { useState, useEffect } from "react";
import { X, Bot } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { ChatMessages } from "./chat-messages";
import { ChatInput } from "./chat-input";
import type { ChatMessage, PageContext } from "@/lib/ai/chat/types";
import { AI_CHAT } from "@/lib/constants/ai";

interface ChatPanelProps {
  open: boolean;
  onClose: () => void;
  pageContext?: PageContext;
}

export function ChatPanel({ open, onClose, pageContext }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Réinitialiser quand le panel se ferme
  useEffect(() => {
    if (!open) {
      const timeout = setTimeout(() => {
        setMessages([]);
        setInput("");
        setError(null);
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [open]);

  async function sendRequest(
    msgs: ChatMessage[],
    opts: { confirmedPlan?: boolean } = {},
  ) {
    setError(null);
    setIsLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: msgs,
          pageContext,
          confirmedPlan: opts.confirmedPlan,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Erreur du service de chat");
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply ?? "",
          links: data.links ?? [],
          pendingPlan: data.pendingPlan,
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit() {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = { role: "human", content: text };
    const next = [...messages, userMessage];

    const truncated =
      next.length > AI_CHAT.maxHistory
        ? next.slice(next.length - AI_CHAT.maxHistory)
        : next;

    setMessages(truncated);
    setInput("");

    await sendRequest(truncated);
  }

  async function handleConfirmPlan() {
    // Effacer le pendingPlan pour l'affichage (pas de bulle texte)
    const cleared = messages.map((m, i) =>
      i === messages.length - 1 ? { ...m, pendingPlan: undefined } : m,
    );

    const truncated =
      cleared.length > AI_CHAT.maxHistory
        ? cleared.slice(cleared.length - AI_CHAT.maxHistory)
        : cleared;

    setMessages(truncated);

    // Envoyer un signal "Confirmer" silencieux à l'API (non affiché dans l'UI)
    const apiMessages: ChatMessage[] = [
      ...truncated,
      { role: "human", content: "Confirmer" },
    ];
    await sendRequest(apiMessages, { confirmedPlan: true });
  }

  function handleCancelPlan() {
    setMessages((prev) => [
      ...prev.slice(0, -1),
      { ...prev[prev.length - 1], pendingPlan: undefined },
      { role: "assistant", content: "Action annulée. Je n'ai effectué aucune modification." },
    ]);
  }

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[62] bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={cn(
          // Mobile : bottom sheet
          "fixed inset-x-0 bottom-0 z-[63]",
          "flex flex-col rounded-t-2xl bg-background shadow-xl",
          "max-h-[85dvh]",
          // Desktop : panneau latéral droit
          "lg:inset-auto lg:right-0 lg:top-0 lg:bottom-0",
          "lg:w-96 lg:rounded-none lg:rounded-l-2xl lg:border-l lg:border-border",
          "lg:max-h-full",
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Assistant IA"
      >
        {/* Handle mobile */}
        <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-muted lg:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 pt-4">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold">Assistant</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-12 w-12 items-center justify-center rounded-full hover:bg-muted"
            aria-label="Fermer l'assistant"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <ChatMessages
            messages={messages}
            isLoading={isLoading}
            onConfirmPlan={handleConfirmPlan}
            onCancelPlan={handleCancelPlan}
          />
        </div>

        {/* Erreur */}
        {error && (
          <p className="mx-4 mb-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        {/* Input */}
        <ChatInput
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          disabled={isLoading}
        />
      </div>
    </>
  );
}
