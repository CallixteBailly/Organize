import { NextRequest, NextResponse } from "next/server";

const SIRENE_API = "https://recherche-entreprises.api.gouv.fr/search";

export async function GET(request: NextRequest) {
  const siret = request.nextUrl.searchParams.get("q");

  if (!siret || !/^\d{14}$/.test(siret)) {
    return NextResponse.json(
      { error: "SIRET invalide — 14 chiffres attendus" },
      { status: 400 },
    );
  }

  let data;
  try {
    const res = await fetch(`${SIRENE_API}?q=${siret}&mtm_campaign=organize`, {
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Service de recherche indisponible" },
        { status: 502 },
      );
    }

    data = await res.json();
  } catch {
    return NextResponse.json(
      { error: "Service de recherche indisponible" },
      { status: 502 },
    );
  }

  if (!data.results?.length) {
    return NextResponse.json(
      { error: "Aucun etablissement trouve pour ce SIRET" },
      { status: 404 },
    );
  }

  const company = data.results[0];
  // Find the matching establishment by SIRET
  const etablissement = company.matching_etablissements?.find(
    (e: { siret: string }) => e.siret === siret,
  ) ?? company.matching_etablissements?.[0];

  // Extract first physical person dirigeant (typically the owner)
  const dirigeant = company.dirigeants?.find(
    (d: { type_dirigeant: string }) => d.type_dirigeant === "personne physique",
  );

  return NextResponse.json({
    name: company.nom_complet ?? "",
    address: etablissement?.adresse ?? "",
    city: etablissement?.libelle_commune ?? "",
    postalCode: etablissement?.code_postal ?? "",
    vatNumber: company.numero_tva_intra ?? "",
    dirigeantFirstName: dirigeant?.prenoms ?? "",
    dirigeantLastName: dirigeant?.nom ?? "",
  });
}
