import { createFileRoute, Link } from '@tanstack/react-router'
import ThemeToggle from '@/components/ThemeToggle'
import { Label } from '@/components/ui/label'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  return (
    <div className="min-h-svh bg-background">
      <header className="flex h-14 items-center justify-end border-b border-border px-4">
        <ThemeToggle />
      </header>
      <main className="page-wrap flex flex-col items-center px-4 py-12">
        <div className="block-card w-full max-w-md p-6 sm:p-8">
          <h1 className="font-display text-2xl font-semibold text-[var(--on-surface)]">
            Sign in
          </h1>
          <p className="font-body text-sm text-[var(--on-surface-variant)] mt-2 mb-6">
            Staff access to Block Center. Authentication will be enabled in
            CTR-13.
          </p>

          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className="input-field"
                placeholder="you@example.com"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                className="input-field"
              />
            </div>
            <button type="submit" className="btn-primary w-full" disabled>
              Sign in (coming soon)
            </button>
          </form>

          <p className="mt-6 font-body text-center text-xs text-[var(--on-surface-variant)]">
            <Link
              to="/"
              className="font-medium underline-offset-4 hover:underline"
            >
              Continue to dashboard preview
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
