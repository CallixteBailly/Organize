import { Text } from "@react-email/components";
import { EmailLayout } from "./layout";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface QuoteEmailProps {
  customerName: string;
  quoteNumber: string;
  totalTtc: string;
  validUntil?: Date;
  garageName: string;
  garageEmail?: string;
}

export function QuoteEmail({
  customerName,
  quoteNumber,
  totalTtc,
  validUntil,
  garageName,
  garageEmail,
}: QuoteEmailProps) {
  return (
    <EmailLayout preview={`Devis ${quoteNumber} — ${totalTtc} EUR`}>
      <Text style={heading}>Devis {quoteNumber}</Text>
      <Text style={paragraph}>
        Bonjour {customerName},
      </Text>
      <Text style={paragraph}>
        Veuillez trouver ci-dessous le recapitulatif du devis etabli par{" "}
        <strong>{garageName}</strong> :
      </Text>
      <Text style={detail}>
        Numero : <strong>{quoteNumber}</strong>
      </Text>
      <Text style={detail}>
        Montant TTC : <strong>{totalTtc} EUR</strong>
      </Text>
      {validUntil && (
        <Text style={detail}>
          Valide jusqu&apos;au : <strong>{format(new Date(validUntil), "dd MMMM yyyy", { locale: fr })}</strong>
        </Text>
      )}
      <Text style={paragraph}>
        N&apos;hesitez pas a nous contacter pour toute question ou pour accepter ce devis.
      </Text>
      {garageEmail && (
        <Text style={paragraph}>
          Contact : {garageEmail}
        </Text>
      )}
    </EmailLayout>
  );
}

const heading = { fontSize: "20px", fontWeight: "bold" as const, color: "#1a1a1a" };
const paragraph = { fontSize: "14px", lineHeight: "24px", color: "#525f7f" };
const detail = {
  fontSize: "14px",
  lineHeight: "20px",
  color: "#1a1a1a",
  margin: "4px 0",
};
