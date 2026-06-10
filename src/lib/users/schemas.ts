import { z } from "zod";

export const listUsersSchema = z.object({
	searchValue: z.string().optional(),
	searchField: z.enum(["email", "name"]).optional(),
	searchOperator: z.enum(["contains", "starts_with", "ends_with"]).optional(),
	limit: z.union([z.string(), z.number()]).optional(),
	offset: z.union([z.string(), z.number()]).optional(),
	sortBy: z.string().optional(),
	sortDirection: z.enum(["asc", "desc"]).optional(),
	filterField: z.string().optional(),
	filterValue: z
		.union([
			z.string(),
			z.number(),
			z.boolean(),
			z.array(z.string()),
			z.array(z.number()),
		])
		.optional(),
	filterOperator: z
		.enum(["eq", "ne", "gt", "gte", "lt", "lte", "contains", "in"])
		.optional(),
});

export const updateUserSchema = z.object({
	userId: z.string().min(1),
	data: z
		.record(z.string(), z.any())
		.refine(
			(value) => Object.keys(value).length > 0,
			"At least one field must be provided",
		)
		.superRefine((data, ctx) => {
			if (
				typeof data.firstName === "string" &&
				!/^[A-Za-zÀ-ÿ ]+$/.test(data.firstName)
			) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: "First name can only contain letters",
					path: ["firstName"],
				});
			}
			if (typeof data.firstName === "string" && data.firstName.length > 15) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: "First name must be at most 15 characters",
					path: ["firstName"],
				});
			}
			if (
				typeof data.lastName === "string" &&
				!/^[A-Za-zÀ-ÿ ]+$/.test(data.lastName)
			) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: "Last name can only contain letters",
					path: ["lastName"],
				});
			}
			if (typeof data.lastName === "string" && data.lastName.length > 15) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: "Last name must be at most 15 characters",
					path: ["lastName"],
				});
			}
		}),
});

export const createUserSchema = z.object({
	email: z.string().email(),
	firstName: z
		.string()
		.min(1, "First name is required")
		.max(15, "First name must be at most 15 characters")
		.regex(/^[A-Za-zÀ-ÿ ]+$/, "First name can only contain letters"),
	lastName: z
		.string()
		.min(1, "Last name is required")
		.max(15, "Last name must be at most 15 characters")
		.regex(/^[A-Za-zÀ-ÿ ]+$/, "Last name can only contain letters"),
	password: z.string().min(8, "Password must be at least 8 characters"),
	data: z.record(z.string(), z.any()).optional(),
});

export const deleteUserSchema = z.object({
	userId: z.string().min(1),
});
