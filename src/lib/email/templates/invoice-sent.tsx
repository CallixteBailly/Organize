import { Text } from "@react-email/components";
import { EmailLayout } from "./layout";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface InvoiceEmailProps {
  customerName: string;
  invoiceNumber: string;
  totalTtc: string;
  dueDate: Date;
  garageName: string;
  garageEmail?: string;
  pdfUrl?: string;
}

export function InvoiceEmail({
  customerName,
  invoiceNumber,
  totalTtc,
  dueDate,
  garageName,
  garageEmail,
}: InvoiceEmailProps) {
  return (
    <EmailLayout preview={`Facture ${invoiceNumber} — ${totalTtc} EUR`}>
      <Text style={heading}>Facture {invoiceNumber}</Text>
      <Text style={paragraph}>
        Bonjour {customerName},
      </Text>
      <Text style={paragraph}>
        Veuillez trouver ci-dessous le recapitulatif de votre facture emise par{" "}
        <strong>{garageName}</strong> :
      </Text>
      <Text style={detail}>
        Numero : <strong>{invoiceNumber}</strong>
      </Text>
      <Text style={detail}>
        Montant TTC : <strong>{totalTtc} EUR</strong>
      </Text>
      <Text style={detail}>
        Date d&apos;echeance : <strong>{format(new Date(dueDate), "dd MMMM yyyy", { locale: fr })}</strong>
      </Text>
      <Text style={paragraph}>
        Nous vous remercions de bien vouloir proceder au reglement avant la date d&apos;echeance
        indiquee.
      </Text>
      {garageEmail && (
        <Text style={paragraph}>
          Pour toute question, contactez-nous a {garageEmail}.
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
