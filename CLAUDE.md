@AGENTS.md

# Organize — SaaS Mobile-First pour Garages

## Stack
- Next.js 15 (App Router) + React 19 + Tailwind CSS v4
- Drizzle ORM + PostgreSQL (Neon) + Redis (Upstash)
- Auth.js v5 (beta) avec JWT sessions
- Vitest (unit) + Playwright (E2E)

## Commandes
- `pnpm dev` �� dev server avec Turbopack
- `pnpm build` — production build
- `pnpm test` — tests unitaires (Vitest)
- `pnpm test:e2e` — tests E2E (Playwright, necessite `pnpm dev`)
- `pnpm db:push` — sync schema vers DB
- `pnpm db:generate` — generer migrations
- `pnpm db:studio` — Drizzle Studio (UI DB)

## Architecture
- `src/app/` — Pages Next.js (App Router), groupes `(auth)` et `(dashboard)`
- `src/components/ui/` — Composants atomiques (Button, Input, Card, Badge, etc.)
- `src/components/modules/` — Composants domaine (dashboard charts)
- `src/components/layouts/` — AppShell, Sidebar, MobileNav, Topbar
- `src/lib/db/schema/` — Schema Drizzle (17 tables), 1 fichier par table
- `src/lib/auth/` — Config Auth.js + types augmentes
- `src/lib/utils/` — cn(), format, NF525 crypto
- `src/server/services/` — Logique metier, 1 service par domaine
- `src/server/actions/` — Server Actions (mutations formulaires)
- `src/server/validators/` — Schemas Zod partages client/serveur
- `src/server/middleware/` — API guards (withAuth)

## Conventions
- **Tenant isolation** : `garageId` en premier param de chaque fonction service
- **Server Actions** : signature `(prevState, formData)`, IDs via hidden inputs (pas de `.bind`)
- **RBAC** : 4 roles (owner, manager, mechanic, secretary), matrice dans `src/lib/constants/roles.ts`
- **NF525** : hash chain SHA-256, finalisation = lock irreversible, jamais supprimer une facture
- **Tests** : ecrire les tests validators/utils avec chaque phase, lancer `pnpm test` avant commit
- **Mobile-first** : touch targets 48px min, bottom nav mobile, sidebar desktop
- **Francais** : messages d'erreur Zod en francais, UI en francais
