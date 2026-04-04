import { Text } from "@react-email/components";
import { EmailLayout } from "./layout";

interface PaymentConfirmationEmailProps {
  customerName: string;
  invoiceNumber: string;
  amountPaid: string;
  paymentMethod: string;
  garageName: string;
}

const methodLabels: Record<string, string> = {
  cash: "Especes",
  card: "Carte bancaire",
  bank_transfer: "Virement bancaire",
  check: "Cheque",
  online: "Paiement en ligne",
};

export function PaymentConfirmationEmail({
  customerName,
  invoiceNumber,
  amountPaid,
  paymentMethod,
  garageName,
}: PaymentConfirmationEmailProps) {
  return (
    <EmailLayout preview={`Paiement recu — Facture ${invoiceNumber}`}>
      <Text style={heading}>Paiement recu</Text>
      <Text style={paragraph}>
        Bonjour {customerName},
      </Text>
      <Text style={paragraph}>
        Nous confirmons la reception de votre paiement pour la facture{" "}
        <strong>{invoiceNumber}</strong> aupres de <strong>{garageName}</strong>.
      </Text>
      <Text style={detail}>
        Montant recu : <strong>{amountPaid} EUR</strong>
      </Text>
      <Text style={detail}>
        Mode de paiement : <strong>{methodLabels[paymentMethod] ?? paymentMethod}</strong>
      </Text>
      <Text style={paragraph}>
        Merci pour votre confiance.
      </Text>
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
