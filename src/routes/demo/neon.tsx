import { createFileRoute, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

import { getClient } from "#/db";

const getTodos = createServerFn({
	method: "GET",
}).handler(async () => {
	const client = await getClient();
	if (!client) {
		return undefined;
	}
	return (await client.query(`SELECT * FROM todos`)) as Array<{
		id: number;
		title: string;
	}>;
});

const insertTodo = createServerFn({
	method: "POST",
})
	.inputValidator((d: { title: string }) => d)
	.handler(async ({ data }) => {
		const client = await getClient();
		if (!client) {
			return undefined;
		}
		await client.query(`INSERT INTO todos (title) VALUES ($1)`, [data.title]);
	});

export const Route = createFileRoute("/demo/neon")({
	component: App,
	loader: async () => {
		const todos = await getTodos();
		return { todos };
	},
});

function App() {
	const { todos } = Route.useLoaderData();
	const router = useRouter();

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.target as HTMLFormElement);
		const data = Object.fromEntries(formData);
		await insertTodo({ data: { title: data.title as string } });
		router.invalidate();
	};

	if (!todos) {
		return <DBConnectionError />;
	}

	return (
		<div className="page-wrap px-4 py-12">
			<div className="block-card p-6 sm:p-8">
				<div className="block-header pb-4 mb-6">
					<p className="font-body text-xs font-bold uppercase tracking-[0.05em] text-[var(--on-surface-variant)] mb-1">
						Demo
					</p>
					<h1 className="font-display text-3xl font-bold text-[var(--on-surface)]">
						Neon Database
					</h1>
				</div>

				<h2 className="font-display text-xl font-semibold text-[var(--on-surface)] mb-4">
					Todos
				</h2>

				<ul className="space-y-3 mb-6">
					{todos.map((todo: { id: number; title: string }) => (
						<li
							key={todo.id}
							className="block-card px-4 py-3 flex items-center justify-between transition hover:bg-[var(--surface-container-low)]"
						>
							<span className="font-body text-base text-[var(--on-surface)]">
								{todo.title}
							</span>
							<span className="font-body text-xs text-[var(--on-surface-variant)]">
								#{todo.id}
							</span>
						</li>
					))}
				</ul>

				<form onSubmit={handleSubmit} className="flex gap-2">
					<input type="text" name="title" className="input-field flex-1" />
					<button type="submit" className="btn-primary whitespace-nowrap">
						Add Todo
					</button>
				</form>
			</div>
		</div>
	);
}

function DBConnectionError() {
	return (
		<div className="page-wrap px-4 py-12 text-center">
			<div className="block-card p-8 max-w-xl mx-auto space-y-6">
				<h2 className="font-display text-2xl font-bold text-[var(--on-surface)]">
					Database Connection Issue
				</h2>
				<p className="font-body text-base text-[var(--on-surface-variant)]">
					The Neon database is not connected.
				</p>
				<div className="p-4 border border-[var(--outline)] rounded-lg bg-[var(--surface-container-low)] text-left">
					<h3 className="font-body text-xs font-bold uppercase tracking-[0.05em] text-[var(--on-surface)] mb-4">
						Required Steps to Fix:
					</h3>
					<ul className="space-y-3 list-none font-body text-sm text-[var(--on-surface-variant)]">
						<li className="flex items-start gap-3">
							<span className="flex items-center justify-center w-7 h-7 rounded-lg border border-[var(--outline)] bg-[var(--primary)] text-[var(--on-primary)] font-body text-xs font-bold shrink-0">
								1
							</span>
							<span>
								Use the <code className="font-body text-xs">db/init.sql</code>{" "}
								file to create the database
							</span>
						</li>
						<li className="flex items-start gap-3">
							<span className="flex items-center justify-center w-7 h-7 rounded-lg border border-[var(--outline)] bg-[var(--primary)] text-[var(--on-primary)] font-body text-xs font-bold shrink-0">
								2
							</span>
							<span>
								Set the <code className="font-body text-xs">DATABASE_URL</code>{" "}
								environment variable to your Neon connection string
							</span>
						</li>
					</ul>
				</div>
			</div>
		</div>
	);
}
