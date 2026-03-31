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

  // ── Capacités owner (toutes les permissions) ──

  it("owner a toutes les capacités d'écriture", () => {
    const prompt = buildChatSystemPrompt(base);
    expect(prompt).toContain("Créer et modifier des clients");
    expect(prompt).toContain("Créer et modifier des interventions");
    expect(prompt).toContain("Créer et modifier des articles en stock");
    expect(prompt).toContain("Créer des factures brouillon");
    expect(prompt).toContain("Créer et modifier des fournisseurs");
    expect(prompt).toContain("Créer des devis");
  });

  it("owner a toutes les capacités de lecture", () => {
    const prompt = buildChatSystemPrompt(base);
    expect(prompt).toContain("Rechercher et consulter les clients");
    expect(prompt).toContain("Rechercher et consulter les interventions");
    expect(prompt).toContain("Rechercher et consulter le stock");
    expect(prompt).toContain("Rechercher et consulter les devis");
    expect(prompt).toContain("Rechercher et consulter les factures");
    expect(prompt).toContain("commandes fournisseurs");
    expect(prompt).toContain("KPIs du tableau de bord");
    expect(prompt).toContain("catalogue pièces");
  });

  // ── Capacités mechanic (permissions limitées) ──

  it("mechanic n'a pas accès au tableau de bord", () => {
    const prompt = buildChatSystemPrompt({ ...base, role: "mechanic" });
    expect(prompt).not.toContain("KPIs du tableau de bord");
  });

  it("mechanic n'a pas accès aux factures en lecture/écriture", () => {
    const prompt = buildChatSystemPrompt({ ...base, role: "mechanic" });
    expect(prompt).not.toContain("Rechercher et consulter les factures");
    expect(prompt).not.toContain("Créer des factures brouillon");
  });

  it("mechanic n'a pas accès aux devis en lecture/écriture", () => {
    const prompt = buildChatSystemPrompt({ ...base, role: "mechanic" });
    expect(prompt).not.toContain("Rechercher et consulter les devis");
    expect(prompt).not.toContain("Créer des devis");
  });

  it("mechanic a accès aux clients et interventions", () => {
    const prompt = buildChatSystemPrompt({ ...base, role: "mechanic" });
    expect(prompt).toContain("Créer et modifier des clients");
    expect(prompt).toContain("Créer et modifier des interventions");
  });

  it("mechanic n'a pas accès à la modification du stock", () => {
    const prompt = buildChatSystemPrompt({ ...base, role: "mechanic" });
    expect(prompt).not.toContain("Créer et modifier des articles en stock");
    // Mais a la consultation
    expect(prompt).toContain("Rechercher et consulter le stock");
  });

  // ── Capacités secretary ──

  it("secretary a accès aux factures, devis, stock, fournisseurs", () => {
    const prompt = buildChatSystemPrompt({ ...base, role: "secretary" });
    expect(prompt).toContain("Créer des factures brouillon");
    expect(prompt).toContain("Créer des devis");
    expect(prompt).toContain("Créer et modifier des articles en stock");
    expect(prompt).toContain("Créer et modifier des fournisseurs");
  });

  // ── Règles générales ──

  it("est en français", () => {
    const prompt = buildChatSystemPrompt(base);
    expect(prompt).toContain("Réponds toujours en français");
  });

  it("contient une restriction de périmètre explicite", () => {
    const prompt = buildChatSystemPrompt(base);
    expect(prompt).toContain("PÉRIMÈTRE STRICT");
    expect(prompt).toContain("gestion du garage");
  });

  it("interdit la finalisation de factures", () => {
    const prompt = buildChatSystemPrompt(base);
    expect(prompt).toContain("Ne jamais finaliser de factures");
  });

  it("interdit la suppression de données", () => {
    const prompt = buildChatSystemPrompt(base);
    expect(prompt).toContain("Ne jamais supprimer de données");
  });
});
