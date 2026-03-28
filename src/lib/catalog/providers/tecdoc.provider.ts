import type { IVehicleCatalogProvider, CatalogVehicle, CatalogCategory } from "../types";
import { CatalogProviderError } from "../errors";

/**
 * Implémentation TecDoc (Tecalliance).
 * Nécessite un compte B2B Tecalliance avec TECDOC_API_KEY et TECDOC_PROVIDER_ID.
 *
 * TODO: Brancher quand le compte Tecalliance est disponible.
 * L'interface IVehicleCatalogProvider est déjà conforme — il suffit de compléter
 * les méthodes resolveVehicleByPlate et getPartsByVehicle.
 */
export class TecDocProvider implements IVehicleCatalogProvider {
  constructor(
    private apiKey: string,
    private apiUrl: string,
    private providerId: string,
  ) {}

  async resolveVehicleByPlate(_plate: string): Promise<CatalogVehicle | null> {
    throw new CatalogProviderError(
      "TecDoc non configuré. Définissez CATALOG_PROVIDER=tecdoc et les variables TECDOC_*.",
    );
  }

  async getPartsByVehicle(_kTypeId: number): Promise<CatalogCategory[]> {
    throw new CatalogProviderError(
      "TecDoc non configuré. Définissez CATALOG_PROVIDER=tecdoc et les variables TECDOC_*.",
    );
  }
}
