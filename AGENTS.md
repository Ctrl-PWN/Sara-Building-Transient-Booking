# Sara-Building-Transient-Booking

## Stack

- **Framework:** TanStack Start (React 19, SSR via Nitro)
- **Package manager:** npm (despite `pnpm` sections in package.json — there is a `package-lock.json`)
- **Database:** Neon (Postgres) + Drizzle ORM (only DB layer — no `@neondatabase/serverless`)
- **Auth:** Better Auth (email/password, cookie-based, TanStack Start plugin)
- **Styling:** Tailwind CSS v4 (`@import 'tailwindcss'` syntax, NOT `@tailwind` directives)
- **UI:** shadcn/ui (base-nova style) with **Base UI** primitives, icons via `@phosphor-icons/react`
- **Forms:** TanStack Form v1 (`@tanstack/react-form`) with Zod validation via Standard Schema
- **React Compiler:** enabled via `babel-plugin-react-compiler` + `reactCompilerPreset()` in `vite.config.ts`
- **Dev server:** `npm run dev` → port **3000**

## Key commands

| Command               | What it does                          |
| --------------------- | ------------------------------------- |
| `npm run dev`         | Dev server on port 3000               |
| `npm run build`       | Production build → `.output/` (Nitro) |
| `npm run test`        | Vitest (no tests exist yet)           |
| `npm run lint`        | ESLint (tanstack config)              |
| `npm run lint:biome`  | Biome lint (scoped to `src/`)         |
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
  {domain}.mutations.ts # mutationOptions factories (accept QueryClient)
```

Shared flat libs: `auth.ts`, `auth-client.ts`, `nav.ts`, `utils.ts`.

Timeline pure utils (no server): `week.ts`, `positioning.ts`.

### Data fetching

- **Server:** `createServerFn` in `*.functions.ts` with Zod `inputValidator`; Drizzle helpers stay private in the same file
- **Client:** `queryOptions` factories in `*.queries.ts` import server functions from `*.functions.ts` (not `*.server.ts` — import protection blocks that)
- **Route loaders:** `context.queryClient.ensureQueryData(...)` for SSR prefetch
- **SSR:** TanStack Query wired in `src/router.tsx` via `setupRouterSsrQueryIntegration` — no standalone `<QueryClientProvider>` wrapper

Import `createServerFn` exports from `*.functions.ts` in query files only (not raw Drizzle helpers).

### Integrations

```
src/integrations/
  tanstack-query/   # QueryClient in root-provider.tsx, devtools
  tanstack-form/    # useAppForm, validation helpers, form composition hooks
```

- **TanStack Query:** `getContext()` in `src/integrations/tanstack-query/root-provider.tsx` — per-request `QueryClient`, SSR via `setupRouterSsrQueryIntegration` in `src/router.tsx`.
- **TanStack Form:** import `useAppForm` from `@/integrations/tanstack-form` (not raw `useForm`). No root provider — form state is local per instance.
  - Composition API: `form.AppField`, `form.AppForm`, `withForm`, `withFieldGroup`, `formOptions`.
  - **Render props:** always use **inline JSX children** on `form.AppField`, `form.Field`, and `form.Subscribe` — never the `children` prop.
  - Dynamic validation: `dynamicSchemaValidators(schema)` spreads `validationLogic` + `validators.onDynamic`; use for complex/conditional Zod schemas.
  - Field components: `@/components/form` (`TextField`, `TextareaField`, `CheckboxField`, `SubmitButton`, `ResetButton`). UI primitives: `@/components/ui`.

### Forms

Domain Zod schemas live in `src/lib/{domain}/schemas.ts` — shared by server fn `inputValidator` and form validators.

**Simple forms** (`onSubmit` only — static rules):

```tsx
const form = useAppForm({
  defaultValues: { ... } satisfies z.infer<typeof mySchema>,
  validators: { onSubmit: mySchema },
  onSubmit: async ({ value }) => { /* mutate */ },
})
```

**Complex forms** (`onDynamic` + `validationLogic` — conditional/cross-field rules):

```tsx
import { dynamicSchemaValidators, useAppForm } from '@/integrations/tanstack-form'

const form = useAppForm({
  defaultValues: { ... } satisfies z.infer<typeof complexSchema>,
  ...dynamicSchemaValidators(complexSchema),
  onSubmit: async ({ value }) => { /* mutate */ },
})
```

Use `.superRefine()`, `.refine()`, or `z.discriminatedUnion()` in schemas for conditional validation. Import validation helpers from `@/integrations/tanstack-form` — do not call `revalidateLogic()` ad hoc in routes unless overriding timing.

`onDynamic` is **never called** unless `validationLogic` is set (via `dynamicSchemaValidators` or explicit `revalidateLogic()`).

**Render pattern** (inline children required):

```tsx
<form
  onSubmit={(e) => {
    e.preventDefault()
    e.stopPropagation()
    form.handleSubmit()
  }}
>
  <form.AppForm>
    <FieldGroup>
      <form.AppField name="guestName">
        {(field) => <field.TextField label="Guest name" />}
      </form.AppField>
    </FieldGroup>
    <form.SubmitButton label="Save" />
  </form.AppForm>
</form>
```

**Validation UX:**

- Simple (`onSubmit`): show errors when `field.state.meta.isTouched && !field.state.meta.isValid`.
- Dynamic (`onDynamic`): errors after first submit attempt, then revalidate on change (default `revalidateLogic()` behavior).
- Add field-level `onChange`/`onBlur` for async or early single-field feedback alongside `onDynamic`.

**Split forms:** `withForm` + spread `formOptions({ defaultValues })` for multi-section forms.

### Mutations

| Layer           | File                    | Responsibility                                                           |
| --------------- | ----------------------- | ------------------------------------------------------------------------ |
| Input schema    | `{domain}.schemas.ts`   | Zod — shared by server fn + form validators                              |
| Server write    | `{domain}.functions.ts` | `createServerFn({ method: 'POST' }).inputValidator(schema).handler(...)` |
| Cache keys      | `{domain}.queries.ts`   | `queryKeys` factories                                                    |
| Mutation config | `{domain}.mutations.ts` | `mutationOptions` factories accepting `QueryClient`                      |
| Route/component | form `onSubmit`         | `useMutation(domainMutations.x(queryClient))` + `mutateAsync`            |

```ts
// bookings.mutations.ts
export const bookingMutations = {
  updateStatus: (queryClient: QueryClient) =>
    mutationOptions({
      mutationFn: (input) => updateBookingStatus({ data: input }),
      onSuccess: (_data, { id }) => {
        void queryClient.invalidateQueries({ queryKey: bookingKeys.detail(id) })
        void queryClient.invalidateQueries({ queryKey: bookingKeys.all })
        void queryClient.invalidateQueries({ queryKey: timelineKeys.all })
      },
    }),
}
```

```tsx
const queryClient = useQueryClient()
const mutation = useMutation(bookingMutations.updateStatus(queryClient))

const form = useAppForm({
  defaultValues: { id, status: 'CONFIRMED' },
  validators: { onSubmit: updateStatusSchema },
  onSubmit: async ({ value }) => {
    await mutation.mutateAsync(value)
    form.reset()
  },
})
```

Map server errors in `onSubmit` (try/catch) or mutation `onError`; use `form.setFieldMeta` for server-side field errors when needed.

### Components

```
src/components/
  layout/     # AppShell, PageHeader
  bookings/   # BookingStatusBadge, BookingFieldGrid
  timeline/   # TimelineGrid, TimelinePageContent, etc.
  form/       # TanStack Form field + form components (TextField, SubmitButton, etc.)
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
