import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useAppForm } from "@/integrations/tanstack-form";
import { authClient } from "@/lib/auth-client";
import { logInSchema } from "@/lib/session/schemas";
import { getSession } from "@/lib/session/session.functions";

export const Route = createFileRoute("/log-in/")({
	loader: async () => {
		const session = await getSession();
		if (session) {
			throw redirect({ to: "/", replace: true });
		}
	},
	component: LogInPage,
});

function LogInPage() {
	const router = useRouter();
	const [error, setError] = useState("");

	const form = useAppForm({
		defaultValues: {
			email: "",
			password: "",
		},
		validators: {
			onChange: logInSchema,
		},
		onSubmit: async ({ value }) => {
			setError("");
			const result = await authClient.signIn.email({
				email: value.email,
				password: value.password,
			});
			if (result.error) {
				setError(result.error.message || "Sign in failed");
				return;
			}
			await router.navigate({ to: "/dashboard", replace: true });
		},
	});

	return (
		<main className="relative min-h-svh bg-[#0f0f0e]">
			<div className="absolute inset-0">
				<img
					src="/log-in-background.png"
					alt=""
					width={1774}
					height={887}
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
							width={780}
							height={780}
							className="h-24 w-auto max-w-full object-contain"
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
							e.preventDefault();
							e.stopPropagation();
							void form.handleSubmit();
						}}
						className="grid gap-4"
						noValidate
					>
						<form.AppField name="email">
							{(field) => (
								<field.TextField
									label="Email"
									type="email"
									autoComplete="email"
								/>
							)}
						</form.AppField>

						<form.AppField name="password">
							{(field) => (
								<field.PasswordField
									label="Password"
									autoComplete="current-password"
								/>
							)}
						</form.AppField>

						{error ? (
							<div
								role="alert"
								aria-live="assertive"
								className="rounded-xl border border-red-400/30 bg-red-950/60 p-3 text-xs text-red-300"
							>
								{error}
							</div>
						) : null}

						<form.Subscribe
							selector={(state) => [state.canSubmit, state.isSubmitting]}
						>
							{([canSubmit, isSubmitting]) => (
								<Button
									type="submit"
									disabled={!canSubmit || isSubmitting}
									aria-busy={isSubmitting}
									className="h-11 w-full rounded-xl bg-[var(--secondary)] text-sm font-semibold text-[var(--on-secondary)] transition hover:-translate-y-0.5 hover:bg-[#f0d5b8] disabled:opacity-60"
								>
									{isSubmitting ? <Spinner data-icon="inline-start" /> : null}
									{isSubmitting ? "Signing in…" : "Sign in"}
								</Button>
							)}
						</form.Subscribe>
					</form>
				</div>
			</section>
		</main>
	);
}
