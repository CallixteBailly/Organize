"use client";

import { useState, useRef, useEffect } from "react";
import { X, Zap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { QuickCapturePreview } from "./quick-capture-preview";
import type { QuickCapturePreview as PreviewData } from "@/server/validators/quick-capture";

type SheetState = "input" | "loading" | "preview";

interface QuickCaptureSheetProps {
  open: boolean;
  onClose: () => void;
}

export function QuickCaptureSheet({ open, onClose }: QuickCaptureSheetProps) {
  const [state, setState] = useState<SheetState>("input");
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus textarea quand le sheet s'ouvre
  useEffect(() => {
    if (open && state === "input") {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [open, state]);

  // Réinitialiser quand on ferme
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setState("input");
        setText("");
        setPreview(null);
        setError(null);
      }, 300);
    }
  }, [open]);

  async function handleAnalyse() {
    if (!text.trim() || text.trim().length < 3) return;
    setState("loading");
    setError(null);

    try {
      const res = await fetch("/api/quick-capture/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Erreur lors de l'analyse");
      }

      setPreview(data);
      setState("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      setState("input");
    }
  }

  function handleBack() {
    setState("input");
    setPreview(null);
    setError(null);
  }

  function handleSuccess() {
    onClose();
  }

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-[61]",
          "flex flex-col rounded-t-2xl bg-background shadow-xl",
          "max-h-[92dvh]",
          "lg:inset-auto lg:left-1/2 lg:top-1/2 lg:right-auto lg:bottom-auto",
          "lg:-translate-x-1/2 lg:-translate-y-1/2",
          "lg:w-full lg:max-w-lg lg:rounded-2xl",
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Saisie rapide"
      >
        {/* Handle mobile */}
        <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-muted lg:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 pt-4">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold">Saisie rapide</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-y-auto px-4 pb-20 lg:pb-6">
          {state === "input" && (
            <div className="flex flex-col gap-4">
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAnalyse();
                }}
                placeholder="Décrivez l'intervention...&#10;Ex : Vidange Clio 4 de Martin, 180€, payé CB"
                rows={4}
                className={cn(
                  "w-full resize-none rounded-xl border border-border bg-background",
                  "p-3 text-base placeholder:text-muted-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-ring",
                )}
              />
              {error && (
                <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Vous pouvez aussi dicter via le micro de votre clavier.
              </p>
              <Button
                onClick={handleAnalyse}
                disabled={text.trim().length < 3}
                size="lg"
                className="w-full"
              >
                <Zap className="h-4 w-4" />
                Analyser
              </Button>
            </div>
          )}

          {state === "loading" && (
            <div className="flex flex-col items-center gap-3 py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Analyse en cours...</p>
            </div>
          )}

          {state === "preview" && preview && (
            <QuickCapturePreview
              preview={preview}
              onBack={handleBack}
              onSuccess={handleSuccess}
            />
          )}
        </div>
      </div>
    </>
  );
}
