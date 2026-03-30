import { tool } from "@langchain/core/tools";
import { z } from "zod/v4";
import { hasPermission } from "@/lib/constants/roles";
import { createNavigationTools } from "./navigation-tools";
import { createReadTools } from "./read-tools";
import { createWriteTools } from "./write-tools";
import type { ToolContext } from "../types";

// Outil de proposition d'actions — pauses l'agent pour confirmation utilisateur
const proposeActionsTool = tool(
  async (input: { summary: string }) => {
    return JSON.stringify({ __pendingPlan__: true, summary: input.summary });
  },
  {
    name: "propose_actions",
    description:
      "Soumet à l'utilisateur un résumé des créations/modifications avant de les exécuter. Appeler TOUJOURS avant toute écriture en base de données. Cherche d'abord les infos nécessaires (IDs), puis appelle cet outil.",
    schema: z.object({
      summary: z
        .string()
        .describe(
          "Résumé en markdown des actions à effectuer. Ex: 'Je vais créer :\\n- **Client** : Sophie Leblanc (06 11 22 33 44)\\n- **Véhicule** : Peugeot 308 (AB-123-CD)\\n- **Intervention** : Bruit moteur au démarrage'",
        ),
    }),
  },
);

export function getToolsForContext(ctx: ToolContext, options?: { planningMode?: boolean }) {
  const { role } = ctx;
  const planningMode = options?.planningMode ?? true;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tools: any[] = [...createNavigationTools()];

  const read = createReadTools(ctx);
  const write = createWriteTools(ctx);

  // Déterminer si l'utilisateur a des permissions d'écriture
  const hasWriteAccess =
    hasPermission(role, "customers:edit") ||
    hasPermission(role, "repair-orders:edit") ||
    hasPermission(role, "quotes:edit");

  // Read tools — selon les permissions de lecture
  if (hasPermission(role, "customers:view")) {
    tools.push(read.searchCustomers, read.getCustomer, read.searchVehicles);
  }
  if (hasPermission(role, "repair-orders:view")) {
    tools.push(read.searchRepairOrders, read.getRepairOrder);
  }
  if (hasPermission(role, "stock:view")) {
    tools.push(read.searchStock);
  }
  if (hasPermission(role, "dashboard:view")) {
    tools.push(read.getDashboardKpis);
  }

  if (planningMode && hasWriteAccess) {
    // Mode planification : propose_actions au lieu des write tools
    tools.push(proposeActionsTool);
  } else if (!planningMode) {
    // Mode exécution (après confirmation) : write tools directs
    if (hasPermission(role, "customers:edit")) {
      tools.push(write.createCustomer, write.createVehicle);
    }
    if (hasPermission(role, "repair-orders:edit")) {
      tools.push(write.createRepairOrder, write.updateRepairOrderStatus);
    }
    if (hasPermission(role, "quotes:edit")) {
      tools.push(write.createQuoteDraft);
    }
  }

  return tools;
}
