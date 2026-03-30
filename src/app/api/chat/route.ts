import { NextRequest, NextResponse } from "next/server";
import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";
import { withAuth } from "@/server/middleware/with-auth";
import type { AuthContext } from "@/server/middleware/with-auth";
import { chatRequestSchema } from "@/server/validators/chat";
import { checkAIRateLimit } from "@/lib/ai/rate-limit";
import { sanitizePromptInput } from "@/lib/ai/sanitize";
import { AIDisabledError, AIRateLimitError, AIConfigError } from "@/lib/ai/errors";
import { buildChatSystemPrompt } from "@/lib/ai/chat/system-prompt";
import { getToolsForContext } from "@/lib/ai/chat/tools";
import { runAgentLoop } from "@/lib/ai/chat/agent";

async function handler(req: NextRequest, ctx: AuthContext) {
  // Rate limiting
  try {
    await checkAIRateLimit(ctx.userId);
  } catch (err) {
    if (err instanceof AIRateLimitError) {
      return NextResponse.json({ error: err.message }, { status: 429 });
    }
    console.error("[Chat] Échec vérification rate limit:", err);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de la requête invalide" }, { status: 400 });
  }

  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données invalides" },
      { status: 400 },
    );
  }

  const { messages, pageContext, confirmedPlan } = parsed.data;
  const planningMode = !confirmedPlan;

  // Construire le system prompt (userName vient de withAuth, pas de second auth())
  const systemPrompt = buildChatSystemPrompt({
    userName: ctx.userName,
    role: ctx.role,
    pageContext,
    planningMode,
  });

  // Convertir les messages en format LangChain + sanitiser tous les messages
  const langchainMessages = [
    new SystemMessage(systemPrompt),
    ...messages.map((m) => {
      const sanitized = sanitizePromptInput(m.content);
      if (m.role === "human") {
        return new HumanMessage(sanitized);
      }
      return new AIMessage(sanitized);
    }),
  ];

  // Assembler les tools selon le rôle et le mode
  const tools = getToolsForContext(
    { garageId: ctx.garageId, userId: ctx.userId, role: ctx.role },
    { planningMode },
  );

  try {
    const result = await runAgentLoop(langchainMessages, tools);
    return NextResponse.json({
      reply: result.reply,
      links: result.links,
      pendingPlan: result.pendingPlan,
    });
  } catch (err) {
    if (err instanceof AIDisabledError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    if (err instanceof AIConfigError) {
      return NextResponse.json({ error: "Service IA non configuré" }, { status: 500 });
    }
    const message = err instanceof Error ? err.message : "Erreur interne";
    console.error("[Chat] Erreur:", message);
    if (message.includes("timeout") || message.includes("timed out")) {
      return NextResponse.json({ error: "La requête a pris trop de temps. Réessayez." }, { status: 504 });
    }
    return NextResponse.json({ error: "Erreur du service de chat" }, { status: 500 });
  }
}

export const POST = withAuth(handler);
