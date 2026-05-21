import { Link } from '@tanstack/react-router'
import ThemeToggle from './ThemeToggle'

export default function Header() {
  return (
    <header className="border-b-2 border-[var(--charcoal)] bg-[var(--surface)]">
      <div className="page-wrap flex items-center gap-6 py-3">
        <h2 className="m-0 flex-shrink-0">
          <Link
            to="/"
            className="block no-underline font-display text-xl font-bold text-[var(--on-surface)]"
          >
            Sara Building
          </Link>
        </h2>

        <nav className="flex items-center gap-1 font-data text-sm font-medium">
          <Link
            to="/"
            className="block rounded-[1rem] border-2 border-[var(--charcoal)] px-4 py-1.5 no-underline text-[var(--on-surface)] transition hover:bg-[var(--primary)] hover:text-[var(--on-primary)]"
            activeProps={{
              className:
                'block rounded-[1rem] border-2 border-[var(--charcoal)] px-4 py-1.5 no-underline bg-[var(--primary)] text-[var(--on-primary)]',
            }}
          >
            Home
          </Link>
          <Link
            to="/about"
            className="block rounded-[1rem] border-2 border-[var(--charcoal)] px-4 py-1.5 no-underline text-[var(--on-surface)] transition hover:bg-[var(--primary)] hover:text-[var(--on-primary)]"
            activeProps={{
              className:
                'block rounded-[1rem] border-2 border-[var(--charcoal)] px-4 py-1.5 no-underline bg-[var(--primary)] text-[var(--on-primary)]',
            }}
          >
            About
          </Link>
          <a
            href="https://tanstack.com/start/latest/docs/framework/react/overview"
            className="block rounded-[1rem] border-2 border-[var(--charcoal)] px-4 py-1.5 no-underline text-[var(--on-surface)] transition hover:bg-[var(--primary)] hover:text-[var(--on-primary)]"
            target="_blank"
            rel="noreferrer"
          >
            Docs
          </a>
          <details className="relative">
            <summary className="block cursor-pointer list-none rounded-[1rem] border-2 border-[var(--charcoal)] px-4 py-1.5 font-data text-sm font-medium text-[var(--on-surface)] transition hover:bg-[var(--primary)] hover:text-[var(--on-primary)]">
              Demos
            </summary>
            <div className="absolute right-0 mt-2 min-w-48 block-card p-1 z-50">
              <a
                href="/demo/drizzle"
                className="block rounded-[1rem] px-3 py-2 text-sm font-data text-[var(--on-surface)] no-underline transition hover:bg-[var(--primary)] hover:text-[var(--on-primary)]"
              >
                Drizzle
              </a>
              <a
                href="/demo/tanstack-query"
                className="block rounded-[1rem] px-3 py-2 text-sm font-data text-[var(--on-surface)] no-underline transition hover:bg-[var(--primary)] hover:text-[var(--on-primary)]"
              >
                TanStack Query
              </a>
              <a
                href="/demo/neon"
                className="block rounded-[1rem] px-3 py-2 text-sm font-data text-[var(--on-surface)] no-underline transition hover:bg-[var(--primary)] hover:text-[var(--on-primary)]"
              >
                Neon
              </a>
              <a
                href="/demo/better-auth"
                className="block rounded-[1rem] px-3 py-2 text-sm font-data text-[var(--on-surface)] no-underline transition hover:bg-[var(--primary)] hover:text-[var(--on-primary)]"
              >
                Better Auth
              </a>
            </div>
          </details>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <BetterAuthHeader />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
