import { AIMessage, ToolMessage, type BaseMessage } from "@langchain/core/messages";
import { getAIClient } from "@/lib/ai/langchain/client";
import { getAIConfig } from "@/lib/ai/config";
import { AIDisabledError } from "@/lib/ai/errors";
import { AI_CHAT } from "@/lib/constants/ai";
import type { AgentResult, NavigationLink } from "./types";

export async function runAgentLoop(
  messages: BaseMessage[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tools: any[],
): Promise<AgentResult> {
  const config = getAIConfig();
  if (!config.enabled) throw new AIDisabledError();

  const client = getAIClient();
  const boundModel = client.bindTools(tools);
  const links: NavigationLink[] = [];
  let currentMessages = [...messages];

  for (let iter = 0; iter < AI_CHAT.maxIterations; iter++) {
    const response = await boundModel.invoke(currentMessages);

    // Extraire le contenu texte
    const content =
      typeof response.content === "string"
        ? response.content
        : Array.isArray(response.content)
          ? response.content
              .map((b: unknown) =>
                typeof b === "string" ? b : (b as { type?: string; text?: string }).type === "text" ? (b as { text: string }).text : "",
              )
              .join("")
          : "";

    // Vérifier si le modèle veut appeler des tools
    const aiMessage = response as AIMessage;
    const toolCalls = aiMessage.tool_calls;

    if (!toolCalls || toolCalls.length === 0) {
      return {
        reply: content || "Je n'ai pas pu générer une réponse. Veuillez reformuler votre question.",
        links,
      };
    }

    // Ajouter le message AI avec les tool_calls
    currentMessages.push(response);

    // Exécuter chaque tool call
    for (const toolCall of toolCalls) {
      const matchingTool = tools.find((t) => t.name === toolCall.name);

      if (!matchingTool) {
        currentMessages.push(
          new ToolMessage({
            content: JSON.stringify({ error: `Outil inconnu: ${toolCall.name}` }),
            tool_call_id: toolCall.id ?? "",
            name: toolCall.name,
          }),
        );
        continue;
      }

      try {
        const result = await matchingTool.invoke(toolCall.args);
        const resultStr = typeof result === "string" ? result : JSON.stringify(result);

        // Détecter le sentinel propose_actions → retourner en attente de confirmation
        try {
          const parsed = JSON.parse(resultStr);
          if (parsed.__pendingPlan__) {
            return { reply: parsed.summary, links, pendingPlan: parsed.summary };
          }
        } catch {}

        // Extraire les liens de navigation depuis les résultats des tools
        try {
          const parsed = JSON.parse(resultStr);
          const candidates = Array.isArray(parsed) ? parsed : [parsed];
          for (const item of candidates) {
            if (item?.href && item?.label && !links.some((l) => l.href === item.href)) {
              links.push({ href: item.href, label: item.label });
            }
          }
        } catch {}

        currentMessages.push(
          new ToolMessage({
            content: resultStr,
            tool_call_id: toolCall.id ?? "",
            name: toolCall.name,
          }),
        );
      } catch (error) {
        console.error(`[Chat Agent] Tool "${toolCall.name}" threw:`, error);
        currentMessages.push(
          new ToolMessage({
            content: JSON.stringify({
              error: error instanceof Error ? error.message : "Erreur lors de l'exécution",
            }),
            tool_call_id: toolCall.id ?? "",
            name: toolCall.name,
          }),
        );
      }
    }
  }

  // Nombre max d'itérations atteint — forcer une réponse finale
  const finalResponse = await client.invoke(currentMessages);
  const finalContent =
    typeof finalResponse.content === "string" ? finalResponse.content : "";

  return {
    reply: finalContent || "Désolé, je n'ai pas pu terminer cette action. Veuillez réessayer.",
    links,
  };
}
