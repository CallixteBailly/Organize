import { Text, Button } from "@react-email/components";
import { EmailLayout } from "./layout";

interface WelcomeEmailProps {
  firstName: string;
  garageName: string;
}

export function WelcomeEmail({ firstName, garageName }: WelcomeEmailProps) {
  return (
    <EmailLayout preview={`Bienvenue sur Organize, ${firstName} !`}>
      <Text style={heading}>Bienvenue sur Organize !</Text>
      <Text style={paragraph}>
        Bonjour {firstName},
      </Text>
      <Text style={paragraph}>
        Votre garage <strong>{garageName}</strong> est maintenant enregistre sur Organize.
        Vous pouvez commencer a gerer vos clients, devis, ordres de reparation et factures.
      </Text>
      <Button style={button} href={`${process.env.AUTH_URL ?? "https://app.organize.fr"}/dashboard`}>
        Acceder a mon tableau de bord
      </Button>
      <Text style={paragraph}>
        Si vous avez des questions, n&apos;hesitez pas a nous contacter.
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
