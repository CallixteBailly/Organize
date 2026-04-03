/**
 * Pure computation functions extracted from stock.service.ts
 * for unit testing without database dependency.
 */

export type MovementType = "entry" | "exit" | "adjustment" | "return";

/**
 * Compute the signed delta for a stock movement.
 * Exit subtracts; entry, adjustment, and return add.
 */
export function computeStockDelta(type: MovementType, quantity: number): number {
  return type === "exit" ? -Math.abs(quantity) : Math.abs(quantity);
}
