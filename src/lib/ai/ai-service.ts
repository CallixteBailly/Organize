import { getAIConfig } from "./config";
import { sanitizePromptInput } from "./sanitize";
import { invokeQuickCaptureChain, invokeDiagnosticChain, invokeQuoteLinesChain, invokeVehicleSummaryChain, invokeMessageDraftChain } from "./langchain/chains";
import { AIDisabledError } from "./errors";
import type { QuickCaptureParsed } from "@/server/validators/quick-capture";
import type { DiagnosticContext } from "./prompts/diagnostic-prompt";
import type { QuoteLinesContext, QuoteLinesSuggestion } from "./prompts/quote-lines-prompt";
import type { VehicleSummaryContext } from "./prompts/vehicle-summary-prompt";
import type { MessageDraftContext } from "./prompts/message-draft-prompt";

export async function parseIntervention(text: string): Promise<QuickCaptureParsed> {
  const config = getAIConfig();
  if (!config.enabled) {
    throw new AIDisabledError();
  }

  const sanitized = sanitizePromptInput(text);
  return invokeQuickCaptureChain(sanitized);
}

export async function suggestDiagnosis(context: DiagnosticContext): Promise<string> {
  const config = getAIConfig();
  if (!config.enabled) {
    throw new AIDisabledError();
  }

  const sanitizedContext: DiagnosticContext = {
    ...context,
    customerComplaint: sanitizePromptInput(context.customerComplaint),
  };

  return invokeDiagnosticChain(sanitizedContext);
}

export async function suggestQuoteLines(context: QuoteLinesContext): Promise<QuoteLinesSuggestion> {
  const config = getAIConfig();
  if (!config.enabled) {
    throw new AIDisabledError();
  }

  const sanitizedContext: QuoteLinesContext = {
    ...context,
    description: sanitizePromptInput(context.description),
  };

  return invokeQuoteLinesChain(sanitizedContext);
}

export async function summarizeVehicleHistory(context: VehicleSummaryContext): Promise<string> {
  const config = getAIConfig();
  if (!config.enabled) {
    throw new AIDisabledError();
  }

  return invokeVehicleSummaryChain(context);
}

export async function draftCustomerMessage(context: MessageDraftContext): Promise<string> {
  const config = getAIConfig();
  if (!config.enabled) {
    throw new AIDisabledError();
  }

  return invokeMessageDraftChain(context);
}
