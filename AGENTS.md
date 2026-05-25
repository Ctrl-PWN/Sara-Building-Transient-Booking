# Sara-Building-Transient-Booking

## Stack

- **Framework:** TanStack Start (React 19, SSR via Nitro)
- **Package manager:** npm (despite `pnpm` sections in package.json — there is a `package-lock.json`)
- **Database:** Neon (Postgres) + Drizzle ORM (only DB layer — no `@neondatabase/serverless`)
- **Auth:** Better Auth (email/password, cookie-based, TanStack Start plugin)
- **Styling:** Tailwind CSS v4 (`@import 'tailwindcss'` syntax, NOT `@tailwind` directives)
- **UI:** shadcn/ui (new-york style) with **Base UI** primitives, icons via `@phosphor-icons/react`
- **Dev server:** `npm run dev` → port **3000**

## Key commands

| Command               | What it does                         |
| --------------------- | ------------------------------------ |
| `npm run dev`         | Dev server on port 3000              |
| `npm run build`       | Production build → `dist/`           |
| `npm run test`        | Vitest (no tests exist yet)          |
| `npm run lint`        | ESLint (tanstack config)             |
| `npm run format`      | Prettier --write + ESLint --fix      |
| `npm run check`       | Prettier --check only                |
| `npm run db:generate` | Drizzle Kit generate migrations      |
| `npm run db:migrate`  | Drizzle Kit migrate                  |
| `npm run db:push`     | Drizzle Kit push (quick schema push) |
| `npm run db:pull`     | Drizzle Kit pull (introspect)        |
| `npm run db:studio`   | Drizzle Kit studio                   |

## Architecture

- **Routes:** `src/routes/` — file-based routing via TanStack Router. `src/routeTree.gen.ts` is auto-generated (NOT in `.gitignore`, but excluded from VS Code search). Edit route files only.
- **Path aliases:** `@/` → `./src/` (tsconfig paths)
- **DB schema:** `src/db/schema.ts` uses `drizzle-orm/pg-core`
- **DB client:** `src/db/index.ts` uses `drizzle-orm/node-postgres` (sole DB layer)
- **Auth server:** `src/lib/auth.ts` — Better Auth config with `tanstackStartCookies()` plugin
- **Auth API:** `src/routes/api/auth/$.ts` — catch-all handler for Better Auth endpoints
- **Drizzle config:** `drizzle.config.ts` — loads from `.env.local` then `.env`

## Quirks & gotchas

- **Before any task**, read relevant installed/global skills listed at the top of the system prompt — they contain repo-specific workflows and conventions.
- **Design reference:** read `DESIGN.md` first if it exists (project design tokens, brand guidelines).
- **Base UI vs Radix:** shadcn uses `base` primitives for this repository. Key API differences: `render` prop instead of `asChild`; `Select` uses `items` prop; `ToggleGroup` uses `multiple` boolean instead of `type`; `Slider` takes scalar for single thumb, not array; `Accordion` uses `multiple` boolean and array `defaultValue`. See `<AGENTS_DIR>/skills/shadcn/rules/base-vs-radix.md` for the full reference.
- **Phosphor icons** from `@phosphor-icons/react` (NOT `lucide-react`). Use PascalCase named exports ending in `Icon` — `GearIcon`, `HouseIcon`, `UserIcon`. Avoid older/short icon names without the `Icon` suffix (they're deprecated). Use `data-icon="inline-start"` / `data-icon="inline-end"` for icons in shadcn `Button`.
- **shadcn** uses `npx` (not `pnpm dlx`).
- **Tailwind v4:** use `@import 'tailwindcss'` in CSS, NOT `@tailwind base/components/utilities`.
- **TanStack Query SSR** is wired in `src/router.tsx` via `setupRouterSsrQueryIntegration`, not a `<QueryClientProvider>` wrapper.
- **No vitest config** — `vitest` is in devDeps but no `vitest.config.ts`. Needs setup before tests work.
- **Better Auth routes** are served via TanStack Start server functions. Auth handler is at `src/routes/api/auth/$.ts`.
- **ThemeToggle** cycles `auto → light → dark → auto` (3-state, persists to localStorage).
- **Lint → format → check** order: `npm run format` does both Prettier AND ESLint fix. `npm run check` is Prettier-only.
- **Generated dirs** `.nitro/`, `.tanstack/`, `.vinxi/` are in `.gitignore` — never commit them.
