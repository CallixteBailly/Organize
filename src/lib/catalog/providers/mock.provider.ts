import type { IVehicleCatalogProvider, CatalogVehicle, CatalogCategory, VehicleModelSearchParams } from "../types";

const MOCK_CATEGORIES: CatalogCategory[] = [
  {
    id: "freins",
    name: "Freins",
    parts: [
      {
        articleId: "mock-plaquettes-av",
        reference: "FD16635",
        name: "Jeu de plaquettes de frein avant",
        brand: "Ferodo",
        description: "Plaquettes frein avant, kit 4 pièces",
        oemNumbers: ["7701208206", "440609483R"],
      },
      {
        articleId: "mock-plaquettes-ar",
        reference: "FDB4453",
        name: "Jeu de plaquettes de frein arrière",
        brand: "Ferodo",
        description: "Plaquettes frein arrière, kit 4 pièces",
        oemNumbers: ["440606428R"],
      },
      {
        articleId: "mock-disque-av",
        reference: "DF4316",
        name: "Disque de frein avant",
        brand: "Delphi",
        description: "Disque frein avant ventilé, Ø 280mm",
        oemNumbers: ["402064EA1A", "402067718R"],
      },
      {
        articleId: "mock-disque-ar",
        reference: "BG3828",
        name: "Disque de frein arrière",
        brand: "Bosch",
        description: "Disque frein arrière plein, Ø 249mm",
        oemNumbers: ["402064CA0A"],
      },
    ],
  },
  {
    id: "filtres",
    name: "Filtres",
    parts: [
      {
        articleId: "mock-filtre-huile",
        reference: "W 712/52",
        name: "Filtre à huile",
        brand: "Mann-Filter",
        description: "Filtre à huile moteur",
        oemNumbers: ["8200768927", "152093978R"],
      },
      {
        articleId: "mock-filtre-air",
        reference: "C 26 030",
        name: "Filtre à air",
        brand: "Mann-Filter",
        description: "Filtre à air moteur",
        oemNumbers: ["8200540494", "165462277R"],
      },
      {
        articleId: "mock-filtre-habitacle",
        reference: "CU 3337",
        name: "Filtre d'habitacle",
        brand: "Mann-Filter",
        description: "Filtre habitacle anti-pollen",
        oemNumbers: ["272772148R"],
      },
      {
        articleId: "mock-filtre-carburant",
        reference: "WK 939/2",
        name: "Filtre à carburant",
        brand: "Mann-Filter",
        description: "Filtre carburant essence",
        oemNumbers: ["164009467R"],
      },
    ],
  },
  {
    id: "moteur",
    name: "Moteur",
    parts: [
      {
        articleId: "mock-huile-moteur",
        reference: "0W30-5L",
        name: "Huile moteur 0W-30 5L",
        brand: "Total",
        description: "Huile moteur synthétique 0W-30, bidon 5L",
        oemNumbers: [],
      },
      {
        articleId: "mock-courroie-distribution",
        reference: "CT1135K1",
        name: "Kit distribution",
        brand: "Gates",
        description: "Kit courroie de distribution complet",
        oemNumbers: ["130C12383R"],
      },
      {
        articleId: "mock-bougie",
        reference: "NGK-BKR6E",
        name: "Bougie d'allumage",
        brand: "NGK",
        description: "Bougie allumage standard (x4)",
        oemNumbers: ["224010153R"],
      },
    ],
  },
  {
    id: "suspension",
    name: "Suspension",
    parts: [
      {
        articleId: "mock-amortisseur-av",
        reference: "339756",
        name: "Amortisseur avant",
        brand: "Monroe",
        description: "Amortisseur avant gauche/droit",
        oemNumbers: ["8200869349"],
      },
      {
        articleId: "mock-silent-bloc",
        reference: "800040",
        name: "Silent-bloc de bras",
        brand: "Mapco",
        description: "Silentbloc de bras de suspension inférieur",
        oemNumbers: ["545013071R"],
      },
    ],
  },
  {
    id: "eclairage",
    name: "Éclairage",
    parts: [
      {
        articleId: "mock-phare-av-g",
        reference: "AL 20-9531 LLEFP",
        name: "Projecteur avant gauche",
        brand: "Hella",
        description: "Projecteur H7 avant gauche",
        oemNumbers: ["260605766R"],
      },
      {
        articleId: "mock-feu-ar-g",
        reference: "2SK 010 956-041",
        name: "Feu arrière gauche",
        brand: "Hella",
        description: "Feu arrière combiné gauche",
        oemNumbers: ["265555741R"],
      },
    ],
  },
  {
    id: "refroidissement",
    name: "Refroidissement",
    parts: [
      {
        articleId: "mock-thermostat",
        reference: "TH6871.88J",
        name: "Thermostat",
        brand: "Wahler",
        description: "Thermostat avec joint, 88°C",
        oemNumbers: ["8200882410"],
      },
      {
        articleId: "mock-pompe-eau",
        reference: "506836",
        name: "Pompe à eau",
        brand: "Dayco",
        description: "Pompe à eau moteur",
        oemNumbers: ["8200461991"],
      },
    ],
  },
  {
    id: "transmission",
    name: "Transmission",
    parts: [
      {
        articleId: "mock-soufflet-cardan",
        reference: "2982",
        name: "Kit soufflet cardan",
        brand: "Lobro",
        description: "Soufflet de cardan extérieur avec graisse",
        oemNumbers: ["8200741967"],
      },
    ],
  },
  {
    id: "embrayage",
    name: "Embrayage",
    parts: [
      {
        articleId: "mock-kit-embrayage",
        reference: "KF383",
        name: "Kit embrayage complet",
        brand: "Valeo",
        description: "Kit embrayage (disque + plateau + butée)",
        oemNumbers: ["302047750R"],
      },
    ],
  },
];

function normalizePlate(plate: string): string {
  return plate.toUpperCase().replace(/[\s-]/g, "");
}

function normalizeForMatch(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function plateToKTypeId(plate: string): number {
  const normalized = normalizePlate(plate);
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = (hash * 31 + normalized.charCodeAt(i)) >>> 0;
  }
  return (hash % 900000) + 100000;
}

const DEMO_VEHICLES: Record<string, Omit<CatalogVehicle, "kTypeId">> = {
  FG533LT: { make: "Renault", model: "Clio IV", year: 2018, engineCode: "H4B", fuelType: "Essence", displacement: 898 },
  AB123CD: { make: "Peugeot", model: "308 II", year: 2016, engineCode: "EP6", fuelType: "Essence", displacement: 1199 },
  GH456EF: { make: "Citroën", model: "C3 III", year: 2020, engineCode: "EB2", fuelType: "Essence", displacement: 1199 },
  IJ789GH: { make: "Volkswagen", model: "Golf VII", year: 2017, engineCode: "CHPB", fuelType: "Essence", displacement: 999 },
  KL012IJ: { make: "BMW", model: "Série 3 (F30)", year: 2015, engineCode: "N47D20C", fuelType: "Diesel", displacement: 1995 },
};

export class MockCatalogProvider implements IVehicleCatalogProvider {
  async resolveVehicleByPlate(plate: string): Promise<CatalogVehicle | null> {
    const normalized = normalizePlate(plate);
    const demo = DEMO_VEHICLES[normalized];

    if (demo) {
      return { kTypeId: plateToKTypeId(normalized), ...demo };
    }

    // Toute plaque inconnue → véhicule générique en mode mock
    return {
      kTypeId: plateToKTypeId(normalized),
      make: "Véhicule",
      model: "Inconnu (mode démo)",
      year: null,
      engineCode: null,
      fuelType: null,
      displacement: null,
    };
  }

  async getPartsByVehicle(_kTypeId: number): Promise<CatalogCategory[]> {
    return MOCK_CATEGORIES;
  }

  async searchVehiclesByModel(params: VehicleModelSearchParams): Promise<CatalogVehicle[]> {
    const targetMake = normalizeForMatch(params.make);
    const targetModel = normalizeForMatch(params.model);

    const results: CatalogVehicle[] = [];

    for (const [plate, v] of Object.entries(DEMO_VEHICLES)) {
      const makeMatches = normalizeForMatch(v.make) === targetMake;
      const modelMatches =
        normalizeForMatch(v.model).includes(targetModel) ||
        targetModel.includes(normalizeForMatch(v.model.split(" ")[0]));
      const yearMatches = !params.year || v.year === params.year;
      const fuelMatches =
        !params.fuelType ||
        normalizeForMatch(v.fuelType ?? "") === normalizeForMatch(params.fuelType);

      if (makeMatches && modelMatches && yearMatches && fuelMatches) {
        results.push({ kTypeId: plateToKTypeId(plate), ...v });
      }
    }

    return results;
  }
}
