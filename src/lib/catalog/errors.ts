export class CatalogDisabledError extends Error {
  constructor() {
    super("Le catalogue pièces est désactivé");
    this.name = "CatalogDisabledError";
  }
}

export class CatalogProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CatalogProviderError";
  }
}

export class CatalogNotFoundError extends Error {
  constructor(plate: string) {
    super(`Véhicule introuvable pour la plaque ${plate}`);
    this.name = "CatalogNotFoundError";
  }
}
