import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { useState } from 'react'
import { z } from 'zod'
import { authClient } from '@/lib/auth-client'

const emailSchema = z.email('Enter a valid email')

const passwordSchema = z.string().min(8, 'Use at least 8 characters')

export const Route = createFileRoute('/log-in/')({
  beforeLoad: async () => {
    const { data } = await authClient.getSession()

    if (data?.session) {
      throw redirect({ to: '/', replace: true })
    }
  },
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
      await router.navigate({ to: '/dashboard', replace: true })
    },
  })

  return (
    <main className="relative min-h-svh bg-[#0f0f0e]">
      <div className="absolute inset-0">
        <img
          src="/log-in-background.png"
          alt=""
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/55 to-black/20" />
      </div>

      <section className="relative flex min-h-svh items-center justify-start px-6 py-10 sm:px-10">
        <div className="w-full max-w-md min-h-[560px] rounded-2xl border border-white/10 bg-[#161615]/90 p-10 backdrop-blur sm:p-12">
          <div className="mb-8">
            <img
              src="/logo.png"
              alt="Sara Building"
              className="h-20 w-100 object-contain"
            />
            <h1 className="mt-3 font-display text-3xl text-[var(--on-surface)]">
              Welcome back
            </h1>
            <p className="mt-3 text-sm text-[var(--on-surface-variant)]">
              Sign in to manage bookings, rooms, and team access.
            </p>
          </div>

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
                  <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--on-surface-variant)]">
                    Email
                  </label>
                  <input
                    type="email"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="h-11 w-full rounded-xl border border-white/15 bg-[#1c1b1a]/90 px-3 text-sm text-[var(--on-surface)] outline-none transition focus:border-[var(--secondary)]"
                  />
                  {field.state.meta.errors?.length ? (
                    <p className="text-xs text-red-400">
                      {field.state.meta.errors.join(', ')}
                    </p>
                  ) : null}
                </div>
              )}
            </form.Field>

            <form.Field name="password">
              {(field) => (
                <div className="grid gap-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--on-surface-variant)]">
                    Password
                  </label>
                  <input
                    type="password"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="h-11 w-full rounded-xl border border-white/15 bg-[#1c1b1a]/90 px-3 text-sm text-[var(--on-surface)] outline-none transition focus:border-[var(--secondary)]"
                  />
                  {field.state.meta.errors?.length ? (
                    <p className="text-xs text-red-400">
                      {field.state.meta.errors.join(', ')}
                    </p>
                  ) : null}
                </div>
              )}
            </form.Field>

            {error ? (
              <div className="rounded-xl border border-red-400/30 bg-red-950/60 p-3 text-xs text-red-300">
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
                  className="h-11 w-full rounded-xl bg-[var(--secondary)] text-sm font-semibold text-[var(--on-secondary)] transition hover:-translate-y-0.5 hover:bg-[#f0d5b8] disabled:opacity-60"
                >
                  {isSubmitting ? 'Please wait...' : 'Sign in'}
                </button>
              )}
            </form.Subscribe>
          </form>
        </div>
      </section>
    </main>
  )
}
