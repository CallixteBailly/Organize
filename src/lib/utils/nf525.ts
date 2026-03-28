import { createHash } from "crypto";

/**
 * NF525 hash chain for French anti-fraud invoicing compliance.
 *
 * Each finalized invoice gets a SHA-256 hash computed from:
 *   previousHash + invoiceNumber + issueDate + totalTTC + garageId
 *
 * The chain is sequential and gap-free per garage.
 * Invoices can never be deleted — only credit notes can be issued.
 */

export interface NF525HashInput {
  previousHash: string | null;
  invoiceNumber: string;
  issueDate: string; // ISO date string
  totalTtc: string;
  garageId: string;
}

export function computeNF525Hash(input: NF525HashInput): string {
  const data = [
    input.previousHash ?? "0",
    input.invoiceNumber,
    input.issueDate,
    input.totalTtc,
    input.garageId,
  ].join("|");

  return createHash("sha256").update(data, "utf-8").digest("hex");
}

export function verifyNF525Chain(
  currentHash: string,
  input: NF525HashInput,
): boolean {
  const expected = computeNF525Hash(input);
  return currentHash === expected;
}
