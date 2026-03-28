import { describe, it, expect } from "vitest";
import { computeNF525Hash, verifyNF525Chain, type NF525HashInput } from "../nf525";

describe("NF525 hash chain", () => {
  const garageId = "550e8400-e29b-41d4-a716-446655440000";

  it("computes a SHA-256 hash", () => {
    const hash = computeNF525Hash({
      previousHash: null,
      invoiceNumber: "FA-00001",
      issueDate: "2026-03-28T00:00:00.000Z",
      totalTtc: "120.00",
      garageId,
    });

    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("first invoice uses '0' as previous hash", () => {
    const hash1 = computeNF525Hash({
      previousHash: null,
      invoiceNumber: "FA-00001",
      issueDate: "2026-03-28T00:00:00.000Z",
      totalTtc: "120.00",
      garageId,
    });

    const hash1WithZero = computeNF525Hash({
      previousHash: "0",
      invoiceNumber: "FA-00001",
      issueDate: "2026-03-28T00:00:00.000Z",
      totalTtc: "120.00",
      garageId,
    });

    // null and "0" should produce the same hash (both normalize to "0")
    expect(hash1).toBe(hash1WithZero);
  });

  it("produces deterministic output", () => {
    const input: NF525HashInput = {
      previousHash: "abc123",
      invoiceNumber: "FA-00002",
      issueDate: "2026-04-01T00:00:00.000Z",
      totalTtc: "250.50",
      garageId,
    };

    const hash1 = computeNF525Hash(input);
    const hash2 = computeNF525Hash(input);
    expect(hash1).toBe(hash2);
  });

  it("different inputs produce different hashes", () => {
    const base: NF525HashInput = {
      previousHash: null,
      invoiceNumber: "FA-00001",
      issueDate: "2026-03-28T00:00:00.000Z",
      totalTtc: "120.00",
      garageId,
    };

    const modified: NF525HashInput = {
      ...base,
      totalTtc: "120.01", // 1 cent difference
    };

    expect(computeNF525Hash(base)).not.toBe(computeNF525Hash(modified));
  });

  it("hash chain is sequential", () => {
    const hash1 = computeNF525Hash({
      previousHash: null,
      invoiceNumber: "FA-00001",
      issueDate: "2026-03-28T00:00:00.000Z",
      totalTtc: "100.00",
      garageId,
    });

    const hash2 = computeNF525Hash({
      previousHash: hash1,
      invoiceNumber: "FA-00002",
      issueDate: "2026-03-29T00:00:00.000Z",
      totalTtc: "200.00",
      garageId,
    });

    const hash3 = computeNF525Hash({
      previousHash: hash2,
      invoiceNumber: "FA-00003",
      issueDate: "2026-03-30T00:00:00.000Z",
      totalTtc: "150.00",
      garageId,
    });

    // Each hash depends on the previous one
    expect(hash1).not.toBe(hash2);
    expect(hash2).not.toBe(hash3);
    expect(hash1).not.toBe(hash3);

    // Verify chain integrity
    expect(
      verifyNF525Chain(hash2, {
        previousHash: hash1,
        invoiceNumber: "FA-00002",
        issueDate: "2026-03-29T00:00:00.000Z",
        totalTtc: "200.00",
        garageId,
      }),
    ).toBe(true);
  });

  it("verifyNF525Chain detects tampering", () => {
    const hash = computeNF525Hash({
      previousHash: null,
      invoiceNumber: "FA-00001",
      issueDate: "2026-03-28T00:00:00.000Z",
      totalTtc: "100.00",
      garageId,
    });

    // Tampered amount
    expect(
      verifyNF525Chain(hash, {
        previousHash: null,
        invoiceNumber: "FA-00001",
        issueDate: "2026-03-28T00:00:00.000Z",
        totalTtc: "99.00", // tampered!
        garageId,
      }),
    ).toBe(false);
  });

  it("different garages produce different hashes", () => {
    const base: NF525HashInput = {
      previousHash: null,
      invoiceNumber: "FA-00001",
      issueDate: "2026-03-28T00:00:00.000Z",
      totalTtc: "120.00",
      garageId,
    };

    const otherGarage: NF525HashInput = {
      ...base,
      garageId: "660e8400-e29b-41d4-a716-446655440000",
    };

    expect(computeNF525Hash(base)).not.toBe(computeNF525Hash(otherGarage));
  });
});
