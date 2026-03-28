import Link from "next/link";
import { PageHeader } from "@/components/layouts/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Users, Truck, ChevronRight } from "lucide-react";

const settingsLinks = [
  {
    href: "/settings/garage",
    icon: Building2,
    label: "Profil du garage",
    description: "Nom, adresse, SIRET, prefixes de documents",
  },
  {
    href: "/settings/users",
    icon: Users,
    label: "Equipe",
    description: "Gerer les utilisateurs et leurs roles",
  },
  {
    href: "/settings/suppliers",
    icon: Truck,
    label: "Fournisseurs",
    description: "Gerer vos fournisseurs de pieces detachees",
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Parametres" />
      <div className="space-y-3">
        {settingsLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="flex items-center gap-4 transition-colors hover:bg-secondary/50">
              <div className="rounded-lg bg-primary/10 p-2.5">
                <link.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">{link.label}</p>
                <p className="text-sm text-muted-foreground">{link.description}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
