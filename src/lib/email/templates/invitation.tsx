import { Text, Button } from "@react-email/components";
import { EmailLayout } from "./layout";

interface InvitationEmailProps {
  firstName: string;
  garageName: string;
  role: string;
  invitedBy: string;
  tempPassword: string;
}

const roleLabels: Record<string, string> = {
  owner: "Gerant",
  manager: "Responsable",
  mechanic: "Mecanicien",
  secretary: "Secretaire",
};

export function InvitationEmail({
  firstName,
  garageName,
  role,
  invitedBy,
  tempPassword,
}: InvitationEmailProps) {
  return (
    <EmailLayout preview={`${invitedBy} vous invite a rejoindre ${garageName}`}>
      <Text style={heading}>Vous etes invite !</Text>
      <Text style={paragraph}>
        Bonjour {firstName},
      </Text>
      <Text style={paragraph}>
        <strong>{invitedBy}</strong> vous a ajoute au garage{" "}
        <strong>{garageName}</strong> avec le role <strong>{roleLabels[role] ?? role}</strong>.
      </Text>
      <Text style={paragraph}>
        Voici vos identifiants de connexion temporaires :
      </Text>
      <Text style={credentials}>
        Mot de passe : <strong>{tempPassword}</strong>
      </Text>
      <Text style={paragraph}>
        Nous vous recommandons de changer votre mot de passe des votre premiere connexion.
      </Text>
      <Button style={button} href={`${process.env.AUTH_URL ?? "https://app.organize.fr"}/login`}>
        Se connecter
      </Button>
    </EmailLayout>
  );
}

const heading = { fontSize: "20px", fontWeight: "bold" as const, color: "#1a1a1a" };
const paragraph = { fontSize: "14px", lineHeight: "24px", color: "#525f7f" };
const credentials = {
  fontSize: "14px",
  lineHeight: "24px",
  color: "#1a1a1a",
  backgroundColor: "#f4f4f5",
  padding: "12px 16px",
  borderRadius: "6px",
  fontFamily: "monospace",
};
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
