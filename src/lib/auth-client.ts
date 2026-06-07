import { adminClient, inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type { auth } from "./auth";

export const authClient = createAuthClient({
	plugins: [
		inferAdditionalFields<typeof auth>(), // infer additional fields from the database schema for type safety in the client
		adminClient(),
	],
});
