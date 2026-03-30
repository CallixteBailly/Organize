"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface DataPoint {
  date: string;
  revenue: number;
}

interface Props {
  data: DataPoint[];
  title?: string;
}

function formatDate(date: string) {
  const d = new Date(date);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
}

export function RevenueChart({ data, title = "Chiffre d'affaires" }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            Aucune donnee pour cette periode
          </div>
        ) : (
          <figure role="img" aria-label={`Graphique ${title}: evolution du chiffre d'affaires`}>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => formatCurrency(v)}
                  tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                  width={80}
                />
                <Tooltip
                  formatter={(value) => [formatCurrency(Number(value)), "CA"]}
                  labelFormatter={(label) => formatDate(String(label))}
                  contentStyle={{
                    backgroundColor: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius)",
                    boxShadow: "var(--shadow-md)",
                    fontSize: "13px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  fill="url(#revenueGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
            {/* Accessible data table for screen readers */}
            <table className="sr-only">
              <caption>{title}</caption>
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Chiffre d&apos;affaires</th>
                </tr>
              </thead>
              <tbody>
                {data.map((point) => (
                  <tr key={point.date}>
                    <td>{formatDate(point.date)}</td>
                    <td>{formatCurrency(point.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </figure>
        )}
      </CardContent>
    </Card>
  );
}
