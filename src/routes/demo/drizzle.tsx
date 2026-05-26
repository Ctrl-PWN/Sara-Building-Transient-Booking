import { createFileRoute, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { desc } from "drizzle-orm";
import { db } from "@/db/index";
import { todos } from "@/db/schema";

const getTodos = createServerFn({
	method: "GET",
}).handler(async () => {
	return await db.query.todos.findMany({
		orderBy: [desc(todos.createdAt)],
	});
});

const createTodo = createServerFn({
	method: "POST",
})
	.inputValidator((data: { title: string }) => data)
	.handler(async ({ data }) => {
		await db.insert(todos).values({ title: data.title });
		return { success: true };
	});

export const Route = createFileRoute("/demo/drizzle")({
	component: DemoDrizzle,
	loader: async () => await getTodos(),
});

function DemoDrizzle() {
	const router = useRouter();
	const todos = Route.useLoaderData();

	const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.target);
		const title = formData.get("title") as string;

		if (!title) return;

		try {
			await createTodo({ data: { title } });
			router.invalidate();
			e.target.reset();
		} catch (error) {
			console.error("Failed to create todo:", error);
		}
	};

	return (
		<div className="page-wrap px-4 py-12">
			<div className="block-card p-6 sm:p-8">
				<div className="block-header pb-4 mb-6">
					<p className="font-body text-xs font-bold uppercase tracking-[0.05em] text-[var(--on-surface-variant)] mb-1">
						Demo
					</p>
					<h1 className="font-display text-3xl font-bold text-[var(--on-surface)]">
						Drizzle Database
					</h1>
				</div>

				<h2 className="font-display text-xl font-semibold text-[var(--on-surface)] mb-4">
					Todos
				</h2>

				<ul className="space-y-3 mb-6">
					{todos.map((todo) => (
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
					{todos.length === 0 && (
						<li className="text-center py-8 font-body text-sm text-[var(--on-surface-variant)]">
							No todos yet. Create one below!
						</li>
					)}
				</ul>

				<form onSubmit={handleSubmit} className="flex gap-2">
					<input
						type="text"
						name="title"
						placeholder="Add a new todo..."
						className="input-field flex-1"
					/>
					<button type="submit" className="btn-primary whitespace-nowrap">
						Add Todo
					</button>
				</form>

				<div className="mt-8 p-4 border border-[var(--outline)] rounded-lg bg-[var(--surface-container-low)]">
					<h3 className="font-display text-lg font-semibold text-[var(--on-surface)] mb-2">
						Powered by Drizzle ORM
					</h3>
					<p className="font-body text-sm text-[var(--on-surface-variant)] mb-4">
						Next-generation ORM for Node.js & TypeScript with PostgreSQL.
					</p>
					<div className="space-y-2 font-body text-sm">
						<p className="font-body text-xs font-bold uppercase tracking-[0.05em] text-[var(--on-surface)]">
							Setup Instructions:
						</p>
						<ol className="list-decimal list-inside space-y-1 text-[var(--on-surface-variant)]">
							<li>
								Configure your{" "}
								<code className="font-body text-xs">DATABASE_URL</code> in
								.env.local
							</li>
							<li>
								Run:{" "}
								<code className="font-body text-xs">
									npx drizzle-kit generate
								</code>
							</li>
							<li>
								Run:{" "}
								<code className="font-body text-xs">
									npx drizzle-kit migrate
								</code>
							</li>
							<li>
								Optional:{" "}
								<code className="font-body text-xs">
									npx drizzle-kit studio
								</code>
							</li>
						</ol>
					</div>
				</div>
			</div>
		</div>
	);
}
