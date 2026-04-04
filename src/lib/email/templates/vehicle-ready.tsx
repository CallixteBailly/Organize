import { Text } from "@react-email/components";
import { EmailLayout } from "./layout";

interface VehicleReadyEmailProps {
  customerName: string;
  vehicleDescription: string;
  garageName: string;
  garagePhone?: string;
  garageAddress?: string;
}

export function VehicleReadyEmail({
  customerName,
  vehicleDescription,
  garageName,
  garagePhone,
  garageAddress,
}: VehicleReadyEmailProps) {
  return (
    <EmailLayout preview={`Votre vehicule ${vehicleDescription} est pret !`}>
      <Text style={heading}>Votre vehicule est pret !</Text>
      <Text style={paragraph}>
        Bonjour {customerName},
      </Text>
      <Text style={paragraph}>
        Nous avons le plaisir de vous informer que les travaux sur votre vehicule{" "}
        <strong>{vehicleDescription}</strong> sont termines.
      </Text>
      <Text style={paragraph}>
        Vous pouvez venir le recuperer a votre convenance chez{" "}
        <strong>{garageName}</strong>.
      </Text>
      {garageAddress && (
        <Text style={detail}>
          Adresse : {garageAddress}
        </Text>
      )}
      {garagePhone && (
        <Text style={detail}>
          Telephone : {garagePhone}
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
  color: "#525f7f",
  margin: "4px 0",
};
