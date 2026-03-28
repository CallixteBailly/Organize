import { PageHeader } from "@/components/layouts/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Euro, Wrench, Package, FileText } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Vue d'ensemble de votre activite" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="CA du jour"
          value="0,00 EUR"
          icon={Euro}
          trend={{ value: 0, label: "vs hier" }}
        />
        <StatCard
          title="Interventions"
          value="0"
          icon={Wrench}
          description="En cours aujourd'hui"
        />
        <StatCard
          title="Alertes stock"
          value="0"
          icon={Package}
          description="Pieces sous le seuil"
        />
        <StatCard
          title="Factures en attente"
          value="0"
          icon={FileText}
          description="A envoyer ou impayees"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Chiffre d&apos;affaires</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
              Graphique CA - Connectez une base de donnees pour voir les donnees
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Activite recente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
              Aucune activite recente
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
