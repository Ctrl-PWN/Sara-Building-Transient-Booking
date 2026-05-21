import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { authClient } from '#/lib/auth-client'

export const Route = createFileRoute('/demo/better-auth')({
  component: BetterAuthDemo,
})

function BetterAuthDemo() {
  const { data: session, isPending } = authClient.useSession()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--charcoal)] border-t-transparent" />
      </div>
    )
  }

  if (session?.user) {
    return (
      <div className="page-wrap px-4 py-12">
        <div className="block-card p-6 sm:p-8 max-w-md mx-auto space-y-6">
          <div className="space-y-1.5">
            <h1 className="font-display text-2xl font-semibold text-[var(--on-surface)]">
              Welcome back
            </h1>
            <p className="font-body text-sm text-[var(--on-surface-variant)]">
              You're signed in as {session.user.email}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {session.user.image ? (
              <img src={session.user.image} alt="" className="h-10 w-10 rounded-[1rem] border-2 border-[var(--charcoal)]" />
            ) : (
              <div className="h-10 w-10 rounded-[1rem] border-2 border-[var(--charcoal)] bg-[var(--surface-container)] flex items-center justify-center">
                <span className="font-data text-sm font-medium text-[var(--on-surface)]">
                  {session.user.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-body text-sm font-medium text-[var(--on-surface)] truncate">
                {session.user.name}
              </p>
              <p className="font-body text-xs text-[var(--on-surface-variant)] truncate">
                {session.user.email}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              void authClient.signOut()
            }}
            className="btn-secondary w-full"
          >
            Sign out
          </button>

          <p className="font-body text-xs text-center text-[var(--on-surface-variant)]">
            Built with{" "}
            <a
              href="https://better-auth.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium"
            >
              BETTER-AUTH
            </a>
            .
          </p>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isSignUp) {
        const result = await authClient.signUp.email({
          email,
          password,
          name,
        })
        if (result.error) {
          setError(result.error.message || 'Sign up failed')
        }
      } else {
        const result = await authClient.signIn.email({
          email,
          password,
        })
        if (result.error) {
          setError(result.error.message || 'Sign in failed')
        }
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-wrap px-4 py-12">
      <div className="block-card p-6 sm:p-8 max-w-md mx-auto">
        <h1 className="font-display text-2xl font-semibold text-[var(--on-surface)]">
          {isSignUp ? 'Create an account' : 'Sign in'}
        </h1>
        <p className="font-body text-sm text-[var(--on-surface-variant)] mt-2 mb-6">
          {isSignUp
            ? 'Enter your information to create an account'
            : 'Enter your email below to login to your account'}
        </p>

        <form onSubmit={handleSubmit} className="grid gap-4">
          {isSignUp && (
            <div className="grid gap-2">
              <label
                htmlFor="name"
                className="font-data text-xs font-bold uppercase tracking-[0.05em] text-[var(--on-surface)]"
              >
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
                required
              />
            </div>
          )}

          <div className="grid gap-2">
            <label htmlFor="email" className="font-data text-xs font-bold uppercase tracking-[0.05em] text-[var(--on-surface)]">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              required
            />
          </div>

          <div className="grid gap-2">
            <label
              htmlFor="password"
              className="font-data text-xs font-bold uppercase tracking-[0.05em] text-[var(--on-surface)]"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              required
              minLength={8}
            />
          </div>

          {error && (
            <div className="border-2 border-[var(--error)] rounded-[1rem] bg-[var(--error-container)] p-3">
              <p className="font-body text-sm text-[var(--on-error-container)]">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--on-primary)] border-t-transparent" />
                <span>Please wait</span>
              </span>
            ) : isSignUp ? (
              'Create account'
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp)
              setError('')
            }}
            className="font-body text-sm text-[var(--on-surface-variant)] hover:text-[var(--on-surface)] transition"
          >
            {isSignUp
              ? 'Already have an account? Sign in'
              : "Don't have an account? Sign up"}
          </button>
        </div>

        <p className="mt-6 font-body text-xs text-center text-[var(--on-surface-variant)]">
          Built with{" "}
          <a
            href="https://better-auth.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium"
          >
            BETTER-AUTH
          </a>
          .
        </p>
      </div>
    </div>
  )
}
