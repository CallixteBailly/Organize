import { describe, it, expect } from "vitest";
import { getToolsForContext } from "../chat/tools";
import type { ToolContext } from "../chat/types";

const ownerCtx: ToolContext = {
  garageId: "garage-1",
  userId: "user-1",
  role: "owner",
};

const mechanicCtx: ToolContext = {
  garageId: "garage-1",
  userId: "user-2",
  role: "mechanic",
};

const secretaryCtx: ToolContext = {
  garageId: "garage-1",
  userId: "user-3",
  role: "secretary",
};

function toolNames(tools: unknown[]): string[] {
  return tools.map((t: unknown) => (t as { name: string }).name);
}

// ── Mode planning (défaut) ──

describe("getToolsForContext — mode planning (défaut)", () => {
  it("owner : contient propose_actions", () => {
    const tools = getToolsForContext(ownerCtx);
    expect(toolNames(tools)).toContain("propose_actions");
  });

  it("owner : ne contient PAS les write tools", () => {
    const tools = getToolsForContext(ownerCtx);
    const names = toolNames(tools);
    expect(names).not.toContain("create_customer");
    expect(names).not.toContain("create_repair_order");
    expect(names).not.toContain("create_stock_item");
    expect(names).not.toContain("create_invoice");
    expect(names).not.toContain("create_supplier");
  });

  it("owner : contient tous les read tools", () => {
    const tools = getToolsForContext(ownerCtx);
    const names = toolNames(tools);
    // Clients & véhicules
    expect(names).toContain("search_customers");
    expect(names).toContain("get_customer");
    expect(names).toContain("search_vehicles");
    // Interventions
    expect(names).toContain("search_repair_orders");
    expect(names).toContain("get_repair_order");
    // Stock
    expect(names).toContain("search_stock");
    expect(names).toContain("get_stock_item");
    // Devis
    expect(names).toContain("search_quotes");
    expect(names).toContain("get_quote");
    // Factures
    expect(names).toContain("search_invoices");
    expect(names).toContain("get_invoice");
    // Commandes & fournisseurs
    expect(names).toContain("search_orders");
    expect(names).toContain("get_order");
    expect(names).toContain("search_suppliers");
    expect(names).toContain("get_supplier");
    // Dashboard
    expect(names).toContain("get_dashboard_kpis");
  });

  it("owner : contient les outils de navigation", () => {
    const tools = getToolsForContext(ownerCtx);
    expect(toolNames(tools)).toContain("navigate_to");
  });

  it("mechanic : contient propose_actions (a write access via customers:edit)", () => {
    const tools = getToolsForContext(mechanicCtx);
    expect(toolNames(tools)).toContain("propose_actions");
  });

  it("mechanic : contient search_repair_orders", () => {
    const tools = getToolsForContext(mechanicCtx);
    expect(toolNames(tools)).toContain("search_repair_orders");
  });

  it("mechanic : ne contient PAS get_dashboard_kpis (pas de dashboard:view)", () => {
    const tools = getToolsForContext(mechanicCtx);
    expect(toolNames(tools)).not.toContain("get_dashboard_kpis");
  });

  it("mechanic : ne contient PAS les read tools factures (pas de invoices:view)", () => {
    const tools = getToolsForContext(mechanicCtx);
    const names = toolNames(tools);
    expect(names).not.toContain("search_invoices");
    expect(names).not.toContain("get_invoice");
  });

  it("mechanic : ne contient PAS les read tools devis (pas de quotes:view)", () => {
    const tools = getToolsForContext(mechanicCtx);
    const names = toolNames(tools);
    expect(names).not.toContain("search_quotes");
    expect(names).not.toContain("get_quote");
  });

  it("mechanic : contient les read tools commandes (a orders:create)", () => {
    const tools = getToolsForContext(mechanicCtx);
    const names = toolNames(tools);
    expect(names).toContain("search_orders");
    expect(names).toContain("get_order");
    expect(names).toContain("search_suppliers");
  });

  it("secretary : contient les read tools devis et factures", () => {
    const tools = getToolsForContext(secretaryCtx);
    const names = toolNames(tools);
    expect(names).toContain("search_quotes");
    expect(names).toContain("get_quote");
    expect(names).toContain("search_invoices");
    expect(names).toContain("get_invoice");
  });
});

// ── Mode exécution (après confirmation) ──

describe("getToolsForContext — mode exécution", () => {
  it("owner : ne contient PAS propose_actions", () => {
    const tools = getToolsForContext(ownerCtx, { planningMode: false });
    expect(toolNames(tools)).not.toContain("propose_actions");
  });

  it("owner : contient les write tools clients/véhicules (CRUD)", () => {
    const tools = getToolsForContext(ownerCtx, { planningMode: false });
    const names = toolNames(tools);
    expect(names).toContain("create_customer");
    expect(names).toContain("update_customer");
    expect(names).toContain("create_vehicle");
    expect(names).toContain("update_vehicle");
  });

  it("owner : contient les write tools interventions (create + update + status)", () => {
    const tools = getToolsForContext(ownerCtx, { planningMode: false });
    const names = toolNames(tools);
    expect(names).toContain("create_repair_order");
    expect(names).toContain("update_repair_order_status");
    expect(names).toContain("update_repair_order");
  });

  it("owner : contient les write tools stock (CRUD)", () => {
    const tools = getToolsForContext(ownerCtx, { planningMode: false });
    const names = toolNames(tools);
    expect(names).toContain("create_stock_item");
    expect(names).toContain("update_stock_item");
  });

  it("owner : contient create_quote_draft", () => {
    const tools = getToolsForContext(ownerCtx, { planningMode: false });
    expect(toolNames(tools)).toContain("create_quote_draft");
  });

  it("owner : contient create_invoice", () => {
    const tools = getToolsForContext(ownerCtx, { planningMode: false });
    expect(toolNames(tools)).toContain("create_invoice");
  });

  it("owner : contient les write tools fournisseurs et commandes", () => {
    const tools = getToolsForContext(ownerCtx, { planningMode: false });
    const names = toolNames(tools);
    expect(names).toContain("create_supplier");
    expect(names).toContain("update_supplier");
    expect(names).toContain("update_order_status");
  });

  it("mechanic : contient create_customer (a customers:edit)", () => {
    const tools = getToolsForContext(mechanicCtx, { planningMode: false });
    expect(toolNames(tools)).toContain("create_customer");
  });

  it("mechanic : contient update_customer et update_vehicle", () => {
    const tools = getToolsForContext(mechanicCtx, { planningMode: false });
    const names = toolNames(tools);
    expect(names).toContain("update_customer");
    expect(names).toContain("update_vehicle");
  });

  it("mechanic : contient update_repair_order (a repair-orders:edit)", () => {
    const tools = getToolsForContext(mechanicCtx, { planningMode: false });
    expect(toolNames(tools)).toContain("update_repair_order");
  });

  it("mechanic : ne contient PAS create_quote_draft (pas de quotes:edit)", () => {
    const tools = getToolsForContext(mechanicCtx, { planningMode: false });
    expect(toolNames(tools)).not.toContain("create_quote_draft");
  });

  it("mechanic : ne contient PAS create_stock_item (pas de stock:edit)", () => {
    const tools = getToolsForContext(mechanicCtx, { planningMode: false });
    const names = toolNames(tools);
    expect(names).not.toContain("create_stock_item");
    expect(names).not.toContain("update_stock_item");
  });

  it("mechanic : ne contient PAS create_invoice (pas de invoices:create)", () => {
    const tools = getToolsForContext(mechanicCtx, { planningMode: false });
    expect(toolNames(tools)).not.toContain("create_invoice");
  });

  it("mechanic : ne contient PAS les tools fournisseurs (pas de orders:manage)", () => {
    const tools = getToolsForContext(mechanicCtx, { planningMode: false });
    const names = toolNames(tools);
    expect(names).not.toContain("create_supplier");
    expect(names).not.toContain("update_supplier");
    expect(names).not.toContain("update_order_status");
  });

  it("secretary : contient create_stock_item (a stock:edit)", () => {
    const tools = getToolsForContext(secretaryCtx, { planningMode: false });
    const names = toolNames(tools);
    expect(names).toContain("create_stock_item");
    expect(names).toContain("update_stock_item");
  });

  it("secretary : contient create_invoice (a invoices:create)", () => {
    const tools = getToolsForContext(secretaryCtx, { planningMode: false });
    expect(toolNames(tools)).toContain("create_invoice");
  });

  it("secretary : contient les tools fournisseurs (a orders:manage)", () => {
    const tools = getToolsForContext(secretaryCtx, { planningMode: false });
    const names = toolNames(tools);
    expect(names).toContain("create_supplier");
    expect(names).toContain("update_supplier");
    expect(names).toContain("update_order_status");
  });

  it("secretary : contient create_quote_draft (a quotes:edit)", () => {
    const tools = getToolsForContext(secretaryCtx, { planningMode: false });
    expect(toolNames(tools)).toContain("create_quote_draft");
  });
});

// ── Cohérence des tools ──

describe("getToolsForContext — cohérence", () => {
  it("chaque tool a un nom unique", () => {
    const tools = getToolsForContext(ownerCtx, { planningMode: false });
    const names = toolNames(tools);
    expect(new Set(names).size).toBe(names.length);
  });

  it("planning mode a plus de tools que d'exécution (propose_actions remplace les write)", () => {
    const planning = getToolsForContext(ownerCtx, { planningMode: true });
    const execution = getToolsForContext(ownerCtx, { planningMode: false });
    // En planning : read + nav + 1 propose_actions
    // En exécution : read + nav + N write tools
    // L'exécution a plus de tools car les N write > 1 propose_actions
    expect(toolNames(execution).length).toBeGreaterThan(toolNames(planning).length);
  });

  it("les read tools sont présents dans les deux modes", () => {
    const planning = getToolsForContext(ownerCtx, { planningMode: true });
    const execution = getToolsForContext(ownerCtx, { planningMode: false });
    const planNames = toolNames(planning);
    const execNames = toolNames(execution);

    const readTools = [
      "search_customers",
      "get_customer",
      "search_vehicles",
      "search_repair_orders",
      "get_repair_order",
      "search_stock",
      "get_stock_item",
      "search_quotes",
      "get_quote",
      "search_invoices",
      "get_invoice",
      "search_orders",
      "get_order",
      "search_suppliers",
      "get_supplier",
      "get_dashboard_kpis",
    ];

    for (const name of readTools) {
      expect(planNames).toContain(name);
      expect(execNames).toContain(name);
    }
  });
});
