import { describe, it, expect } from "vitest";
import { parseClaudeResponse, buildQuickCaptureUserMessage } from "../quick-capture-prompt";

describe("buildQuickCaptureUserMessage", () => {
  it("construit le message utilisateur", () => {
    const msg = buildQuickCaptureUserMessage("Vidange Clio de Martin 180€");
    expect(msg).toBe('Phrase à analyser : "Vidange Clio de Martin 180€"');
  });
});

describe("parseClaudeResponse", () => {
  const validJson = JSON.stringify({
    customer: { firstName: null, lastName: "Martin", companyName: null },
    vehicle: { brand: "Renault", model: "Clio 4", licensePlate: null, year: null },
    service: { description: "Vidange huile", type: "labor" },
    amount: 180,
    mileage: null,
    payment: { method: "card", isPaid: true },
    confidence: 0.95,
  });

  it("parse un JSON valide", () => {
    const result = parseClaudeResponse(validJson);
    expect(result.customer.lastName).toBe("Martin");
    expect(result.vehicle.brand).toBe("Renault");
    expect(result.amount).toBe(180);
    expect(result.payment?.method).toBe("card");
  });

  it("gère les blocs markdown ```json", () => {
    const withFences = "```json\n" + validJson + "\n```";
    const result = parseClaudeResponse(withFences);
    expect(result.customer.lastName).toBe("Martin");
  });

  it("gère les blocs markdown ``` sans langue", () => {
    const withFences = "```\n" + validJson + "\n```";
    const result = parseClaudeResponse(withFences);
    expect(result.vehicle.brand).toBe("Renault");
  });

  it("remplace les champs manquants par des défauts", () => {
    const minimal = JSON.stringify({
      customer: {},
      vehicle: {},
      service: { description: "Diagnostic", type: "labor" },
      confidence: 0.4,
    });
    const result = parseClaudeResponse(minimal);
    expect(result.amount).toBeNull();
    expect(result.payment).toBeNull();
    expect(result.mileage).toBeNull();
    expect(result.confidence).toBe(0.4);
  });

  it("lève une erreur si JSON invalide", () => {
    expect(() => parseClaudeResponse("pas du json")).toThrow();
  });
});
