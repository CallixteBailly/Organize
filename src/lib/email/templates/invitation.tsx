import { Text, Button } from "@react-email/components";
import { EmailLayout } from "./layout";

interface InvitationEmailProps {
  firstName: string;
  garageName: string;
  role: string;
  invitedBy: string;
  activationUrl: string;
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
  activationUrl,
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
        Cliquez sur le bouton ci-dessous pour choisir votre mot de passe et activer votre compte :
      </Text>
      <Button style={button} href={activationUrl}>
        Activer mon compte
      </Button>
      <Text style={paragraph}>
        Ce lien est valable <strong>72 heures</strong>. Si vous n&apos;avez pas demande cette
        invitation, vous pouvez ignorer cet email.
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
