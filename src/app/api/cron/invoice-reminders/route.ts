import { NextResponse } from "next/server";
import { eq, and, inArray, lte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { invoices, customers, garages } from "@/lib/db/schema";
import { sendInvoiceReminderEmail } from "@/server/services/email.service";
import type { GarageSettings } from "@/lib/db/schema/garages";

// Cette route est destinee a etre appelee par un cron job (Vercel Cron, etc.)
// Frequence recommandee : 1 fois par jour
// Exemple vercel.json: { "crons": [{ "path": "/api/cron/invoice-reminders", "schedule": "0 8 * * *" }] }

export async function GET(request: Request) {
  // Verifier le secret pour empecher les appels non autorises
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  try {
    // Recuperer toutes les factures en retard ou impayees
    const overdueInvoices = await db
      .select({
        invoice: invoices,
        customerEmail: customers.email,
        customerFirstName: customers.firstName,
        customerLastName: customers.lastName,
        customerCompanyName: customers.companyName,
        garageName: garages.name,
        garageEmail: garages.email,
        garageSettings: garages.settings,
      })
      .from(invoices)
      .innerJoin(customers, eq(invoices.customerId, customers.id))
      .innerJoin(garages, eq(invoices.garageId, garages.id))
      .where(
        and(
          inArray(invoices.status, ["sent", "finalized", "partially_paid", "overdue"]),
          lte(invoices.dueDate, new Date()),
        ),
      );

    let sent = 0;
    let skipped = 0;

    for (const row of overdueInvoices) {
      const { invoice, customerEmail, garageName, garageEmail, garageSettings } = row;

      if (!customerEmail) {
        skipped++;
        continue;
      }

      const settings = garageSettings as GarageSettings | null;
      const reminderDays = settings?.autoReminderDays ?? [7, 15, 30];

      // Calculer les jours de retard
      const now = new Date();
      const dueDate = new Date(invoice.dueDate);
      const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

      // Verifier si c'est le moment d'envoyer une relance
      const currentReminderCount = invoice.reminderCount;
      if (currentReminderCount >= reminderDays.length) {
        skipped++;
        continue;
      }

      const nextReminderDay = reminderDays[currentReminderCount];
      if (daysOverdue < nextReminderDay) {
        skipped++;
        continue;
      }

      // Verifier qu'on n'a pas deja envoye recemment (24h minimum entre relances)
      if (invoice.lastReminderAt) {
        const hoursSinceLastReminder = (now.getTime() - new Date(invoice.lastReminderAt).getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastReminder < 24) {
          skipped++;
          continue;
        }
      }

      const customerName = row.customerCompanyName
        || [row.customerFirstName, row.customerLastName].filter(Boolean).join(" ")
        || "Client";

      const amountDue = (Number(invoice.totalTtc) - Number(invoice.amountPaid)).toFixed(2);

      try {
        // TODO [LOI FRANCAISE]: Meme contraintes e-invoicing que sendInvoiceEmail
        await sendInvoiceReminderEmail({
          to: customerEmail,
          customerName,
          invoiceNumber: invoice.invoiceNumber,
          totalTtc: invoice.totalTtc,
          amountDue,
          dueDate: invoice.dueDate,
          reminderCount: currentReminderCount + 1,
          garageName,
          garageEmail: garageEmail ?? undefined,
        });

        // Mettre a jour la facture
        await db
          .update(invoices)
          .set({
            status: "overdue",
            reminderCount: sql`${invoices.reminderCount} + 1`,
            lastReminderAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(invoices.id, invoice.id));

        sent++;
      } catch (err) {
        console.error(`[cron/reminders] Erreur envoi relance ${invoice.invoiceNumber}:`, err);
        skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      sent,
      skipped,
      total: overdueInvoices.length,
    });
  } catch (error) {
    console.error("[cron/reminders] Erreur:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
