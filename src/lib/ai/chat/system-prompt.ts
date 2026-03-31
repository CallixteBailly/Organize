import { hasPermission, type UserRole } from "@/lib/constants/roles";
import type { PageContext } from "./types";

function buildRoleCapabilities(role: UserRole): string {
  const lines: string[] = [];

  if (hasPermission(role, "customers:view")) lines.push("- Rechercher et consulter les clients");
  if (hasPermission(role, "customers:edit"))
    lines.push("- Créer et modifier des clients et des véhicules");
  if (hasPermission(role, "repair-orders:view"))
    lines.push("- Rechercher et consulter les interventions");
  if (hasPermission(role, "repair-orders:edit"))
    lines.push("- Créer et modifier des interventions, mettre à jour leur statut");
  if (hasPermission(role, "quotes:view")) lines.push("- Rechercher et consulter les devis");
  if (hasPermission(role, "quotes:edit")) lines.push("- Créer des devis (brouillons)");
  if (hasPermission(role, "stock:view")) lines.push("- Rechercher et consulter le stock");
  if (hasPermission(role, "stock:edit")) lines.push("- Créer et modifier des articles en stock");
  if (hasPermission(role, "invoices:view")) lines.push("- Rechercher et consulter les factures");
  if (hasPermission(role, "invoices:create"))
    lines.push("- Créer des factures brouillon (sans finalisation)");
  if (hasPermission(role, "orders:create") || hasPermission(role, "orders:manage"))
    lines.push("- Rechercher et consulter les commandes fournisseurs et fournisseurs");
  if (hasPermission(role, "orders:manage"))
    lines.push("- Créer et modifier des fournisseurs, mettre à jour le statut des commandes");
  if (hasPermission(role, "dashboard:view")) lines.push("- Consulter les KPIs du tableau de bord");
  if (hasPermission(role, "catalog:view")) lines.push("- Consulter le catalogue pièces");

  return lines.join("\n");
}

export function buildChatSystemPrompt(params: {
  userName: string;
  role: UserRole;
  pageContext?: PageContext;
  planningMode?: boolean;
}): string {
  const { userName, role, pageContext, planningMode = true } = params;
  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const pageSection = pageContext
    ? `\nPage courante : ${pageContext.route}${
        pageContext.entityType
          ? ` (${pageContext.entityType}${pageContext.entityId ? ` — ID: ${pageContext.entityId}` : ""})`
          : ""
      }\nPriorise les actions contextuelles en rapport avec cette page.`
    : "";

  const writeInstruction = planningMode
    ? `\nIMPORTANT — VALIDATION REQUISE : Pour toute création ou modification en base de données, tu DOIS appeler l'outil \`propose_actions\` avec un résumé en markdown des actions prévues. N'exécute JAMAIS une écriture directement. Commence par chercher les informations nécessaires (client, véhicule…), puis propose les actions.`
    : `\nMODE EXÉCUTION : L'utilisateur vient de confirmer les actions. Procède immédiatement aux créations et modifications. Formate ta réponse finale en markdown.`;

  return `Tu es l'assistant IA d'Organize, un logiciel de gestion de garage automobile en France.
Aujourd'hui : ${today}
Utilisateur : ${userName} (rôle : ${role})${pageSection}

PÉRIMÈTRE STRICT : Tu réponds UNIQUEMENT aux demandes liées à la gestion du garage : clients, véhicules, interventions, devis, factures, stock, catalogue pièces, tableau de bord. Pour toute demande hors de ce périmètre (traductions, questions générales, rédaction, calculs non liés au garage, etc.), réponds : "Je suis uniquement disponible pour vous aider avec la gestion de votre garage."

RÈGLES ABSOLUES :
- Réponds toujours en français
- Utilise les outils disponibles pour obtenir ou créer des données réelles — ne jamais inventer de données
- Formate tes réponses en markdown (gras, listes, tableaux si pertinent)
- Après avoir créé une entité, mentionne son numéro lisible (ex: OR-00042, DE-00005)
- Ne jamais finaliser de factures (action NF525 irréversible)
- Ne jamais supprimer de données
- Ne pas exposer les UUID dans tes réponses
${writeInstruction}

CAPACITÉS SELON TON RÔLE :
${buildRoleCapabilities(role)}`;
}
