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

function toolNames(tools: unknown[]): string[] {
  return tools.map((t: unknown) => (t as { name: string }).name);
}

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
  });

  it("owner : contient les read tools", () => {
    const tools = getToolsForContext(ownerCtx);
    const names = toolNames(tools);
    expect(names).toContain("search_customers");
    expect(names).toContain("search_repair_orders");
    expect(names).toContain("get_dashboard_kpis");
  });

  it("mechanic : contient propose_actions (a write access)", () => {
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
});

describe("getToolsForContext — mode exécution", () => {
  it("owner : contient les write tools", () => {
    const tools = getToolsForContext(ownerCtx, { planningMode: false });
    const names = toolNames(tools);
    expect(names).toContain("create_customer");
    expect(names).toContain("create_vehicle");
    expect(names).toContain("create_repair_order");
  });

  it("owner : ne contient PAS propose_actions", () => {
    const tools = getToolsForContext(ownerCtx, { planningMode: false });
    expect(toolNames(tools)).not.toContain("propose_actions");
  });

  it("mechanic : contient create_customer (a customers:edit)", () => {
    const tools = getToolsForContext(mechanicCtx, { planningMode: false });
    expect(toolNames(tools)).toContain("create_customer");
  });

  it("mechanic : ne contient PAS create_quote_draft (pas de quotes:edit)", () => {
    const tools = getToolsForContext(mechanicCtx, { planningMode: false });
    expect(toolNames(tools)).not.toContain("create_quote_draft");
  });
});
