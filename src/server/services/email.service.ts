import { Resend } from "resend";
import type { ReactElement } from "react";

let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

const FROM_EMAIL = "Organize <noreply@organize.app>";

export type EmailPayload = {
  to: string;
  subject: string;
  react: ReactElement;
};

export async function sendEmail(payload: EmailPayload) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY non configuree — email non envoye:", payload.subject);
    return null;
  }

  const { data, error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to: payload.to,
    subject: payload.subject,
    react: payload.react,
  });

  if (error) {
    console.error("[email] Erreur envoi:", error);
    throw new Error(`Erreur envoi email: ${error.message}`);
  }

  return data;
}

// ── Helpers haut niveau ──

export async function sendWelcomeEmail(params: {
  to: string;
  firstName: string;
  garageName: string;
}) {
  const { WelcomeEmail } = await import("@/lib/email/templates/welcome");
  return sendEmail({
    to: params.to,
    subject: `Bienvenue sur Organize — ${params.garageName}`,
    react: WelcomeEmail({ firstName: params.firstName, garageName: params.garageName }),
  });
}

export async function sendInvitationEmail(params: {
  to: string;
  firstName: string;
  garageName: string;
  role: string;
  invitedBy: string;
  tempPassword: string;
}) {
  const { InvitationEmail } = await import("@/lib/email/templates/invitation");
  return sendEmail({
    to: params.to,
    subject: `Vous etes invite a rejoindre ${params.garageName} sur Organize`,
    react: InvitationEmail(params),
  });
}

export async function sendPasswordResetEmail(params: {
  to: string;
  firstName: string;
  resetUrl: string;
}) {
  const { PasswordResetEmail } = await import("@/lib/email/templates/password-reset");
  return sendEmail({
    to: params.to,
    subject: "Reinitialisation de votre mot de passe — Organize",
    react: PasswordResetEmail(params),
  });
}

export async function sendInvoiceEmail(params: {
  to: string;
  customerName: string;
  invoiceNumber: string;
  totalTtc: string;
  dueDate: Date;
  garageName: string;
  garageEmail?: string;
  pdfUrl?: string;
}) {
  // TODO [LOI FRANCAISE - Facturation electronique 2026]:
  // La reforme de la facturation electronique (e-invoicing) en France impose a partir de 2026
  // l'emission de factures au format structure (Factur-X / UBL / CII) via une PDP
  // (Plateforme de Dematerialisation Partenaire) ou le PPF (Portail Public de Facturation).
  // - Verifier si le client est B2B (SIRET present) → obligation e-invoicing
  // - Generer la facture au format Factur-X (PDF/A-3 avec XML embarque)
  // - Transmettre via PDP/PPF pour les clients assujettis TVA en France
  // - Conserver la preuve de depot/transmission
  // - Le simple envoi par email ne suffira PAS pour les factures B2B a partir de sept. 2026
  // Ref: https://www.impots.gouv.fr/facturation-electronique
  const { InvoiceEmail } = await import("@/lib/email/templates/invoice-sent");
  return sendEmail({
    to: params.to,
    subject: `Facture ${params.invoiceNumber} — ${params.garageName}`,
    react: InvoiceEmail(params),
  });
}

export async function sendInvoiceReminderEmail(params: {
  to: string;
  customerName: string;
  invoiceNumber: string;
  totalTtc: string;
  amountDue: string;
  dueDate: Date;
  reminderCount: number;
  garageName: string;
  garageEmail?: string;
}) {
  // TODO [LOI FRANCAISE]: Meme contraintes que sendInvoiceEmail ci-dessus.
  const { InvoiceReminderEmail } = await import("@/lib/email/templates/invoice-reminder");
  return sendEmail({
    to: params.to,
    subject: `Relance facture ${params.invoiceNumber} — ${params.garageName}`,
    react: InvoiceReminderEmail(params),
  });
}

export async function sendQuoteEmail(params: {
  to: string;
  customerName: string;
  quoteNumber: string;
  totalTtc: string;
  validUntil?: Date;
  garageName: string;
  garageEmail?: string;
}) {
  const { QuoteEmail } = await import("@/lib/email/templates/quote-sent");
  return sendEmail({
    to: params.to,
    subject: `Devis ${params.quoteNumber} — ${params.garageName}`,
    react: QuoteEmail(params),
  });
}

export async function sendVehicleReadyEmail(params: {
  to: string;
  customerName: string;
  vehicleDescription: string;
  garageName: string;
  garagePhone?: string;
  garageAddress?: string;
}) {
  const { VehicleReadyEmail } = await import("@/lib/email/templates/vehicle-ready");
  return sendEmail({
    to: params.to,
    subject: `Votre vehicule est pret — ${params.garageName}`,
    react: VehicleReadyEmail(params),
  });
}

export async function sendPaymentConfirmationEmail(params: {
  to: string;
  customerName: string;
  invoiceNumber: string;
  amountPaid: string;
  paymentMethod: string;
  garageName: string;
}) {
  const { PaymentConfirmationEmail } = await import("@/lib/email/templates/payment-confirmation");
  return sendEmail({
    to: params.to,
    subject: `Confirmation de paiement — Facture ${params.invoiceNumber}`,
    react: PaymentConfirmationEmail(params),
  });
}
