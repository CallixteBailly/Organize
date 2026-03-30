import { describe, it, expect } from "vitest";
import { buildChatSystemPrompt } from "../chat/system-prompt";

describe("buildChatSystemPrompt", () => {
  const base = { userName: "Anthony", role: "owner" as const };

  it("contient le nom de l'utilisateur et son rôle", () => {
    const prompt = buildChatSystemPrompt(base);
    expect(prompt).toContain("Anthony");
    expect(prompt).toContain("owner");
  });

  it("mode planning (défaut) : contient l'instruction propose_actions", () => {
    const prompt = buildChatSystemPrompt(base);
    expect(prompt).toContain("propose_actions");
    expect(prompt).toContain("VALIDATION REQUISE");
  });

  it("mode planning explicite : contient l'instruction propose_actions", () => {
    const prompt = buildChatSystemPrompt({ ...base, planningMode: true });
    expect(prompt).toContain("propose_actions");
  });

  it("mode exécution : contient l'instruction d'exécution directe", () => {
    const prompt = buildChatSystemPrompt({ ...base, planningMode: false });
    expect(prompt).toContain("MODE EXÉCUTION");
    expect(prompt).not.toContain("propose_actions");
  });

  it("inclut le contexte de page quand fourni", () => {
    const prompt = buildChatSystemPrompt({
      ...base,
      pageContext: { route: "/customers", entityType: "customer" },
    });
    expect(prompt).toContain("/customers");
    expect(prompt).toContain("customer");
  });

  it("n'inclut pas de section page sans pageContext", () => {
    const prompt = buildChatSystemPrompt(base);
    expect(prompt).not.toContain("Page courante");
  });

  it("inclut l'entityId quand fourni", () => {
    const id = "550e8400-e29b-41d4-a716-446655440000";
    const prompt = buildChatSystemPrompt({
      ...base,
      pageContext: { route: "/r", entityType: "repair_order", entityId: id },
    });
    expect(prompt).toContain(id);
  });

  it("owner a les capacités d'écriture", () => {
    const prompt = buildChatSystemPrompt(base);
    expect(prompt).toContain("Créer des clients");
    expect(prompt).toContain("Créer des interventions");
  });

  it("mechanic n'a pas accès au tableau de bord", () => {
    const prompt = buildChatSystemPrompt({ ...base, role: "mechanic" });
    expect(prompt).not.toContain("KPIs du tableau de bord");
  });

  it("est en français", () => {
    const prompt = buildChatSystemPrompt(base);
    expect(prompt).toContain("Réponds toujours en français");
  });

  it("contient une restriction de périmètre explicite", () => {
    const prompt = buildChatSystemPrompt(base);
    expect(prompt).toContain("PÉRIMÈTRE STRICT");
    expect(prompt).toContain("gestion du garage");
  });
});
