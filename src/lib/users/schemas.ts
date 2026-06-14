import { z } from 'zod'

export const listUsersSchema = z.object({
  searchValue: z.string().optional(),
  searchField: z.enum(['email', 'name']).optional(),
  searchOperator: z.enum(['contains', 'starts_with', 'ends_with']).optional(),
  limit: z.union([z.string(), z.number()]).optional(),
  offset: z.union([z.string(), z.number()]).optional(),
  sortBy: z.string().optional(),
  sortDirection: z.enum(['asc', 'desc']).optional(),
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
    .enum(['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'contains', 'in'])
    .optional(),
})

export const updateUserSchema = z
  .object({
    userId: z.string().min(1),
    firstName: z
      .string()
      .max(15, 'First name must be at most 15 characters')
      .regex(/^[A-Za-zÀ-ÿ ]+$/, 'First name can only contain letters')
      .optional(),
    lastName: z
      .string()
      .max(15, 'Last name must be at most 15 characters')
      .regex(/^[A-Za-zÀ-ÿ ]+$/, 'Last name can only contain letters')
      .optional(),
  })
  .refine(
    (value) => value.firstName !== undefined || value.lastName !== undefined,
    'At least one field must be provided',
  )

export const createUserSchema = z.object({
  email: z.email(),
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(15, 'First name must be at most 15 characters')
    .regex(/^[A-Za-zÀ-ÿ ]+$/, 'First name can only contain letters'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(15, 'Last name must be at most 15 characters')
    .regex(/^[A-Za-zÀ-ÿ ]+$/, 'Last name can only contain letters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  data: z.record(z.string(), z.any()).optional(),
})

export const deleteUserSchema = z.object({
  userId: z.string().min(1),
})
