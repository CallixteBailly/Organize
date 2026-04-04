import { Text, Button } from "@react-email/components";
import { EmailLayout } from "./layout";

interface PasswordResetEmailProps {
  firstName: string;
  resetUrl: string;
}

export function PasswordResetEmail({ firstName, resetUrl }: PasswordResetEmailProps) {
  return (
    <EmailLayout preview="Reinitialisation de votre mot de passe Organize">
      <Text style={heading}>Reinitialisation du mot de passe</Text>
      <Text style={paragraph}>
        Bonjour {firstName},
      </Text>
      <Text style={paragraph}>
        Vous avez demande la reinitialisation de votre mot de passe. Cliquez sur le bouton
        ci-dessous pour choisir un nouveau mot de passe :
      </Text>
      <Button style={button} href={resetUrl}>
        Reinitialiser mon mot de passe
      </Button>
      <Text style={paragraph}>
        Ce lien est valable <strong>1 heure</strong>. Si vous n&apos;avez pas fait cette demande,
        vous pouvez ignorer cet email.
      </Text>
    </EmailLayout>
  );
}

const heading = { fontSize: "20px", fontWeight: "bold" as const, color: "#1a1a1a" };
const paragraph = { fontSize: "14px", lineHeight: "24px", color: "#525f7f" };
const button = {
  backgroundColor: "#1a1a1a",
  borderRadius: "5px",
  color: "#fff",
  fontSize: "14px",
  fontWeight: "bold" as const,
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "12px 20px",
  margin: "24px 0",
};
