# Test Coverage Analysis — Organize

**Date**: 2026-04-03
**Current State**: 228 unit tests (20 files) + ~76 E2E tests (13 files) — all passing

---

## What's Well-Covered

| Area | Tests | Notes |
|------|-------|-------|
| Validators (12/13 schemas) | 133 tests | Excellent — all CRUD validators tested |
| AI module (prompts, tools, sanitize) | 51 tests | Good — prompt building, RBAC tools, sanitization |
| Utils (format, nf525) | 23 tests | Good — NF525 hash chain + formatting |
| Constants (roles/permissions) | 9 tests | Good |
| Dashboard (compute logic) | 11 tests | Only service with unit tests |
| E2E flows | ~76 tests | Good breadth: all pages, RBAC, mobile |

---

## Critical Gaps

### 1. Services: 0/12 have unit tests (except dashboard)

The 12 service files contain core business logic but none are unit-tested:

- **`invoice.service.ts`** — `recalculateInvoiceTotals()`, `finalizeInvoice()` (NF525 chain), `recordPayment()` (status transitions: draft → paid → partially_paid), `generateFECExport()` (regulatory format)
- **`repair-order.service.ts`** — `recalculateRepairOrderTotals()` (HT/VAT/TTC from lines with discounts), `closeRepairOrder()` (stock deduction logic)
- **`quote.service.ts`** — `recalculateQuoteTotals()`, `convertQuoteToRepairOrder()` (line copying)
- **`stock.service.ts`** — `recordStockMovement()` (signed delta: entry +, exit −, adjustment = set), filter logic for `lowStockOnly`
- **`quick-capture.service.ts`** — `fuzzyMatchCustomers()`, `fuzzyMatchVehicles()` (matching algorithms)
- **`customer.service.ts`** — `getCustomerStats()` (aggregate calculations)

**Impact**: Financial calculations, NF525 compliance, and stock management — bugs here directly affect invoicing accuracy and legal compliance.

### 2. Server Actions: 0/12 tested

No unit tests for the action layer. While validators are tested, actions handle:
- Auth guard (`withAuth`) enforcement
- Hidden input ID extraction from `FormData`
- Error state formatting (`{ error: "..." }`)
- `revalidatePath` calls

**Impact**: Medium — actions are thin wrappers but auth guard bypass or wrong revalidation paths could cause security/UX issues.

### 3. API Routes: 0 tested

No unit tests for any of the ~15 API route handlers:
- `/api/invoices/export` — FEC export (regulatory compliance)
- `/api/chat` — AI chat streaming
- `/api/catalog/lookup` — External vehicle lookup
- `/api/dashboard/*` — KPI aggregation

**Impact**: Medium-high for FEC export (regulatory).

### 4. Components: 0 unit/integration tests

No React component tests. Key untested:
- `revenue-chart.tsx`, `comparison-card.tsx` — Data visualization
- `chat-panel.tsx`, `chat-messages.tsx` — Chat UI state
- `quick-capture-preview.tsx` — AI result display
- `offline-indicator.tsx` — PWA offline detection

**Impact**: Low-medium — E2E covers some of this, but component tests catch rendering edge cases faster.

### 5. Missing validators

`common.ts` (`paginationSchema`) and `garage.ts` (`updateGarageSchema`) have no tests.

---

## Recommended Priority

### P0 — Financial & Compliance (highest business risk)

1. **`invoice.service.ts`** — Total recalculation, payment status transitions, NF525 finalization, FEC export format
2. **`repair-order.service.ts`** — Total recalculation with discounts, stock deduction on close
3. **`quote.service.ts`** — Total recalculation, quote → RO conversion integrity

### P1 — Core Business Logic

4. **`stock.service.ts`** — Movement delta logic (entry/exit/adjustment/return), low stock alert threshold
5. **`quick-capture.service.ts`** — Fuzzy matching algorithms (customer name, vehicle plate)
6. **`customer.service.ts`** — Stats aggregation, search logic

### P2 — Integration Layer

7. Server actions — Auth guard enforcement, FormData parsing, error state shape
8. `/api/invoices/export` route — FEC format compliance
9. `/api/dashboard/*` routes — KPI data shape

### P3 — UI & Polish

10. Component tests for `revenue-chart`, `chat-panel`, `quick-capture-preview`
11. `garage.ts` and `common.ts` validators

---

## Testing Strategy for Services

Since services depend on Drizzle/PostgreSQL, two approaches:

### Approach A: Extract Pure Logic (recommended for calculations)

Pull calculation functions into testable pure functions, similar to `dashboard.test.ts`:

```typescript
// src/server/services/invoice.helpers.ts
export function computeLineTotals(lines: InvoiceLine[]) { ... }
export function computeInvoiceStatus(totalTTC: number, totalPaid: number) { ... }
export function formatFECLine(invoice: FinalizedInvoice) { ... }

// src/server/services/stock.helpers.ts
export function computeStockDelta(type: MovementType, quantity: number) { ... }

// src/server/services/repair-order.helpers.ts
export function computeROTotals(lines: ROLine[]) { ... }
```

### Approach B: Mock DB Layer (recommended for workflows)

Use Vitest mocks for `db` to test service orchestration:

```typescript
vi.mock("@/lib/db", () => ({
  db: { select: vi.fn(), insert: vi.fn(), transaction: vi.fn() }
}));
```

### Recommendation

- **Approach A** for financial calculations (totals, status, FEC format)
- **Approach B** for workflow tests (close RO → deduct stock → update status)

---

## Coverage Numbers to Target

| Area | Current | Target |
|------|---------|--------|
| `src/server/services/` | ~5% (dashboard only) | 60%+ |
| `src/server/validators/` | ~90% | 95%+ |
| `src/lib/utils/` | ~80% | 90%+ |
| `src/lib/ai/` | ~70% | 80%+ |
| `src/server/actions/` | 0% | 30%+ |
| `src/components/` | 0% (E2E only) | 20%+ |
