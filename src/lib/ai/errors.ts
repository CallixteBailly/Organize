export class AIDisabledError extends Error {
  constructor() {
    super("Le service IA est désactivé");
    this.name = "AIDisabledError";
  }
}

export class AIConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIConfigError";
  }
}

export class AIParseError extends Error {
  constructor(message: string = "Impossible d'analyser la réponse du modèle IA") {
    super(message);
    this.name = "AIParseError";
  }
}

export class AIRateLimitError extends Error {
  constructor() {
    super("Trop de requêtes IA. Réessayez dans quelques secondes.");
    this.name = "AIRateLimitError";
  }
}
