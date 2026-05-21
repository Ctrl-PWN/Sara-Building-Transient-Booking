import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { useState } from 'react'
import { z } from 'zod'
import { authClient } from '#/lib/auth-client'

const emailSchema = z.email('Enter a valid email');

const passwordSchema = z.string().min(8, 'Use at least 8 characters')

export const Route = createFileRoute('/log-in/')({
  component: LogInPage,
})

function LogInPage() {
  const router = useRouter()
  const [error, setError] = useState('')

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
    validators: {
      onChange: z.object({
        email: emailSchema,
        password: passwordSchema,
      }),
    },
    onSubmit: async ({ value }) => {
      setError('')
      const result = await authClient.signIn.email({
        email: value.email,
        password: value.password,
      })
      if (result.error) {
        setError(result.error.message || 'Sign in failed')
        return
      }
      await router.navigate({ to: '/dashboard' })
    },
  })

  return (
    <main className="page-wrap px-4 py-12">
      <section className="island-shell rise-in relative mx-auto max-w-lg overflow-hidden rounded-[2rem] px-6 py-10 sm:px-10 sm:py-12">
        <div className="pointer-events-none absolute -left-16 -top-16 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(79,184,178,0.24),transparent_65%)]" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(47,106,74,0.16),transparent_68%)]" />

        <p className="island-kicker mb-2">Access</p>
        <h1 className="display-title mb-2 text-3xl font-bold text-[var(--sea-ink)] sm:text-4xl">
          Sign in
        </h1>
        <p className="mb-8 text-sm text-[var(--sea-ink-soft)]">
          Welcome back. Enter your credentials to continue.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            void form.handleSubmit()
          }}
          className="grid gap-4"
          noValidate
        >
          <form.Field name="email">
            {(field) => (
              <div className="grid gap-2">
                <label className="text-sm font-medium text-[var(--sea-ink)]">
                  Email
                </label>
                <input
                  type="email"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="h-10 w-full rounded-xl border border-[var(--line)] bg-white/70 px-3 text-sm focus:outline-none focus:border-[var(--lagoon-deep)]"
                />
                {field.state.meta.errors?.length ? (
                  <p className="text-xs text-red-600">
                    {field.state.meta.errors.join(', ')}
                  </p>
                ) : null}
              </div>
            )}
          </form.Field>

          <form.Field name="password">
            {(field) => (
              <div className="grid gap-2">
                <label className="text-sm font-medium text-[var(--sea-ink)]">
                  Password
                </label>
                <input
                  type="password"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="h-10 w-full rounded-xl border border-[var(--line)] bg-white/70 px-3 text-sm focus:outline-none focus:border-[var(--lagoon-deep)]"
                />
                {field.state.meta.errors?.length ? (
                  <p className="text-xs text-red-600">
                    {field.state.meta.errors.join(', ')}
                  </p>
                ) : null}
              </div>
            )}
          </form.Field>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          ) : null}

          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
          >
            {([canSubmit, isSubmitting]) => (
              <button
                type="submit"
                disabled={!canSubmit || isSubmitting}
                className="h-11 w-full rounded-full bg-[var(--sea-ink)] px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#1c4b52] disabled:opacity-60"
              >
                {isSubmitting ? 'Please wait...' : 'Sign in'}
              </button>
            )}
          </form.Subscribe>
        </form>
      </section>
    </main>
  )
}
