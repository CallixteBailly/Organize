import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { getAIClient } from "./client";
import { QUICK_CAPTURE_SYSTEM_PROMPT, parseClaudeResponse } from "@/lib/ai/quick-capture-prompt";
import {
  DIAGNOSTIC_SYSTEM_PROMPT,
  buildDiagnosticMessage,
  type DiagnosticContext,
} from "@/lib/ai/prompts/diagnostic-prompt";
import {
  QUOTE_LINES_SYSTEM_PROMPT,
  buildQuoteLinesMessage,
  parseQuoteLinesResponse,
  type QuoteLinesContext,
  type QuoteLinesSuggestion,
} from "@/lib/ai/prompts/quote-lines-prompt";
import {
  VEHICLE_SUMMARY_SYSTEM_PROMPT,
  buildVehicleSummaryMessage,
  type VehicleSummaryContext,
} from "@/lib/ai/prompts/vehicle-summary-prompt";
import {
  MESSAGE_DRAFT_SYSTEM_PROMPT,
  buildMessageDraftMessage,
  type MessageDraftContext,
} from "@/lib/ai/prompts/message-draft-prompt";
import { AIParseError } from "@/lib/ai/errors";
import type { QuickCaptureParsed } from "@/server/validators/quick-capture";

export async function invokeQuickCaptureChain(text: string): Promise<QuickCaptureParsed> {
  const client = getAIClient();

  const result = await client.invoke([
    new SystemMessage(QUICK_CAPTURE_SYSTEM_PROMPT),
    new HumanMessage(`Phrase à analyser : "${text}"`),
  ]);

  const content = typeof result.content === "string"
    ? result.content
    : JSON.stringify(result.content);

  try {
    return parseClaudeResponse(content);
  } catch {
    throw new AIParseError(
      `Impossible de parser la réponse IA : ${content.substring(0, 200)}`,
    );
  }
}

// ── Diagnostic Chain ──

export async function invokeDiagnosticChain(context: DiagnosticContext): Promise<string> {
  const client = getAIClient();

  const result = await client.invoke([
    new SystemMessage(DIAGNOSTIC_SYSTEM_PROMPT),
    new HumanMessage(buildDiagnosticMessage(context)),
  ]);

  const content = typeof result.content === "string"
    ? result.content
    : JSON.stringify(result.content);

  if (!content.trim()) {
    throw new AIParseError("Le modèle IA n'a pas retourné de diagnostic");
  }

  return content.trim();
}

// ── Quote Lines Chain ──

export async function invokeQuoteLinesChain(context: QuoteLinesContext): Promise<QuoteLinesSuggestion> {
  const client = getAIClient();

  const result = await client.invoke([
    new SystemMessage(QUOTE_LINES_SYSTEM_PROMPT),
    new HumanMessage(buildQuoteLinesMessage(context)),
  ]);

  const content = typeof result.content === "string"
    ? result.content
    : JSON.stringify(result.content);

  try {
    return parseQuoteLinesResponse(content);
  } catch {
    throw new AIParseError(
      `Impossible de parser les lignes de devis : ${content.substring(0, 200)}`,
    );
  }
}

// ── Vehicle Summary Chain ──

export async function invokeVehicleSummaryChain(context: VehicleSummaryContext): Promise<string> {
  const client = getAIClient();

  const result = await client.invoke([
    new SystemMessage(VEHICLE_SUMMARY_SYSTEM_PROMPT),
    new HumanMessage(buildVehicleSummaryMessage(context)),
  ]);

  const content = typeof result.content === "string"
    ? result.content
    : JSON.stringify(result.content);

  if (!content.trim()) {
    throw new AIParseError("Le modèle IA n'a pas retourné de résumé");
  }

  return content.trim();
}

// ── Message Draft Chain ──

export async function invokeMessageDraftChain(context: MessageDraftContext): Promise<string> {
  const client = getAIClient();

  const result = await client.invoke([
    new SystemMessage(MESSAGE_DRAFT_SYSTEM_PROMPT),
    new HumanMessage(buildMessageDraftMessage(context)),
  ]);

  const content = typeof result.content === "string"
    ? result.content
    : JSON.stringify(result.content);

  if (!content.trim()) {
    throw new AIParseError("Le modèle IA n'a pas retourné de message");
  }

  return content.trim();
}
