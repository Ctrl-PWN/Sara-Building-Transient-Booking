import { createMiddleware, createServerOnlyFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { auth } from "./auth";

const requireAdmin = createServerOnlyFn(async () => {
	const session = await auth.api.getSession({
		headers: getRequestHeaders(),
	});

	if (session?.user.role !== "admin") {
		throw new Response("Forbidden", {
			status: 403,
		});
	}

	return session;
});

export function authMiddleware() {
	return createMiddleware().server(async ({ next }) => {
		await requireAdmin();
		return next();
	});
}

const requireSession = createServerOnlyFn(async (headers: Headers) => {
	const session = await auth.api.getSession({ headers });

	if (!session) {
		throw new Response("Unauthorized", {
			status: 401,
		});
	}

	return session;
});

export function sessionMiddleware() {
	return createMiddleware().server(async ({ next }) => {
		const headers = getRequestHeaders();
		await requireSession(headers);
		return next();
	});
}
