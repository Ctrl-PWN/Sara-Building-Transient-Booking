# Sara-Building-Transient-Booking

## Stack

- **Framework:** TanStack Start (React 19, SSR via Nitro)
- **Package manager:** npm (despite `pnpm` sections in package.json — there is a `package-lock.json`)
- **Database:** Neon (Postgres) + Drizzle ORM (only DB layer — no `@neondatabase/serverless`)
- **Auth:** Better Auth (email/password, cookie-based, TanStack Start plugin)
- **Styling:** Tailwind CSS v4 (`@import 'tailwindcss'` syntax, NOT `@tailwind` directives)
- **UI:** shadcn/ui (base-nova style) with **Base UI** primitives, icons via `@phosphor-icons/react`
- **React Compiler:** enabled via `babel-plugin-react-compiler` + `reactCompilerPreset()` in `vite.config.ts`
- **Dev server:** `npm run dev` → port **3000**

## Key commands

| Command               | What it does                          |
| --------------------- | ------------------------------------- |
| `npm run dev`         | Dev server on port 3000               |
| `npm run build`       | Production build → `.output/` (Nitro) |
| `npm run test`        | Vitest (no tests exist yet)           |
| `npm run lint`        | ESLint (tanstack config)              |
| `npm run format`      | Prettier --write + ESLint --fix       |
| `npm run check`       | Prettier --check only                 |
| `npm run db:generate` | Drizzle Kit generate migrations       |
| `npm run db:migrate`  | Drizzle Kit migrate                   |
| `npm run db:push`     | Drizzle Kit push (quick schema push)  |
| `npm run db:pull`     | Drizzle Kit pull (introspect)         |
| `npm run db:studio`   | Drizzle Kit studio                    |

## Architecture

### Routes & routing

- **Routes:** `src/routes/` — file-based routing via TanStack Router. `src/routeTree.gen.ts` is auto-generated (NOT in `.gitignore`, but excluded from VS Code search). Edit route files only.
- **Path aliases:** `@/` → `./src/` (tsconfig paths)
- **Booking detail:** `/bookings/$bookingId` — numeric DB `bookings.id`
- **Room detail:** `/rooms/$roomId` — numeric DB `rooms.id`
- **Timeline week state:** `/timeline?week=YYYY-MM-DD` (Monday-start weeks)

### Database

- **DB schema:** `src/db/schema/` — barrel at `index.ts`, tables split by domain (`bookings.ts`, `rooms.ts`, etc.)
- **DB client:** `src/db/index.ts` uses `drizzle-orm/node-postgres` (sole DB layer)
- **Drizzle config:** `drizzle.config.ts` — loads from `.env.local` then `.env`

### Auth

- **Auth server:** `src/lib/auth.ts` — Better Auth config with `tanstackStartCookies()` plugin
- **Auth API:** `src/routes/api/auth/$.ts` — catch-all handler for Better Auth endpoints

### Domain lib structure

Feature domains live under `src/lib/{domain}/`:

```
src/lib/{domain}/
  types.ts              # Shared TS types
  schemas.ts            # Zod validators (server fn inputs, route search)
  status.ts             # Domain helpers (when applicable)
  {domain}.functions.ts # Drizzle queries + createServerFn exports
  {domain}.queries.ts   # queryKeys + queryOptions (TanStack Query)
  {domain}.mutations.ts # mutationOptions (future)
```

Shared flat libs: `auth.ts`, `auth-client.ts`, `nav.ts`, `utils.ts`.

Timeline pure utils (no server): `week.ts`, `positioning.ts`.

### Data fetching

- **Server:** `createServerFn` in `*.functions.ts` with Zod `inputValidator`; Drizzle helpers stay private in the same file
- **Client:** `queryOptions` factories in `*.queries.ts` import server functions from `*.functions.ts` (not `*.server.ts` — import protection blocks that)
- **Route loaders:** `context.queryClient.ensureQueryData(...)` for SSR prefetch
- **SSR:** TanStack Query wired in `src/router.tsx` via `setupRouterSsrQueryIntegration` — no standalone `<QueryClientProvider>` wrapper

Import `createServerFn` exports from `*.functions.ts` in query files only (not raw Drizzle helpers).

### Components

```
src/components/
  layout/     # AppShell, PageHeader
  bookings/   # BookingStatusBadge, BookingFieldGrid
  timeline/   # TimelineGrid, TimelinePageContent, etc.
  ui/         # shadcn primitives
```

## Quirks & gotchas

- **Before any task**, read relevant installed/global skills listed at the top of the system prompt — they contain repo-specific workflows and conventions.
- **Design reference:** read `DESIGN.md` first if it exists (project design tokens, brand guidelines).
- **React Compiler:** do not add `useMemo`/`useCallback` for ordinary derived values or handlers in app code. Only use them when a third-party lib requires stable refs (e.g. shadcn `sidebar.tsx`).
- **Base UI vs Radix:** shadcn uses `base` primitives for this repository. Key API differences: `render` prop instead of `asChild`; `Select` uses `items` prop; `ToggleGroup` uses `multiple` boolean instead of `type`; `Slider` takes scalar for single thumb, not array; `Accordion` uses `multiple` boolean and array `defaultValue`. See `<AGENTS_DIR>/skills/shadcn/rules/base-vs-radix.md` for the full reference.
- **Phosphor icons** from `@phosphor-icons/react` (NOT `lucide-react`). Use PascalCase named exports ending in `Icon` — `GearIcon`, `HouseIcon`, `UserIcon`. Avoid older/short icon names without the `Icon` suffix (they're deprecated). Use `data-icon="inline-start"` / `data-icon="inline-end"` for icons in shadcn `Button`.
- **shadcn** uses `npx` (not `pnpm dlx`).
- **Tailwind v4:** use `@import 'tailwindcss'` in CSS, NOT `@tailwind base/components/utilities`.
- **No vitest config** — `vitest` is in devDeps but no `vitest.config.ts`. Needs setup before tests work.
- **ThemeToggle** cycles `auto → light → dark → auto` (3-state, persists to localStorage).
- **Lint → format → check** order: `npm run format` does both Prettier AND ESLint fix. `npm run check` is Prettier-only.
- **Generated dirs** `.nitro/`, `.tanstack/`, `.vinxi/`, `.output/` are in `.gitignore` — never commit them.
