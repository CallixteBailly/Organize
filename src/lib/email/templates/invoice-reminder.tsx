import { Text } from "@react-email/components";
import { EmailLayout } from "./layout";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface InvoiceReminderEmailProps {
  customerName: string;
  invoiceNumber: string;
  totalTtc: string;
  amountDue: string;
  dueDate: Date;
  reminderCount: number;
  garageName: string;
  garageEmail?: string;
}

export function InvoiceReminderEmail({
  customerName,
  invoiceNumber,
  totalTtc,
  amountDue,
  dueDate,
  reminderCount,
  garageName,
  garageEmail,
}: InvoiceReminderEmailProps) {
  const urgency = reminderCount >= 3 ? "Dernier rappel" : reminderCount >= 2 ? "Second rappel" : "Rappel";

  return (
    <EmailLayout preview={`${urgency} — Facture ${invoiceNumber} en attente de paiement`}>
      <Text style={heading}>{urgency} — Facture {invoiceNumber}</Text>
      <Text style={paragraph}>
        Bonjour {customerName},
      </Text>
      <Text style={paragraph}>
        Nous souhaitons vous rappeler que la facture <strong>{invoiceNumber}</strong> emise par{" "}
        <strong>{garageName}</strong> est en attente de reglement.
      </Text>
      <Text style={detail}>
        Montant total TTC : <strong>{totalTtc} EUR</strong>
      </Text>
      <Text style={detail}>
        Reste a payer : <strong>{amountDue} EUR</strong>
      </Text>
      <Text style={detail}>
        Date d&apos;echeance : <strong>{format(new Date(dueDate), "dd MMMM yyyy", { locale: fr })}</strong>
      </Text>
      <Text style={paragraph}>
        Si vous avez deja procede au reglement, veuillez ne pas tenir compte de ce message.
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
