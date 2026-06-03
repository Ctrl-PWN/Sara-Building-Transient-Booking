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

export const updateUserSchema = z.object({
  userId: z.string().min(1),
  data: z
    .record(z.string(), z.any())
    .refine(
      (value) => Object.keys(value).length > 0,
      'At least one field must be provided',
    ),
})

export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(8).optional(),
  role: z.enum(['ADMIN', 'STAFF']).optional(),
  data: z.record(z.string(), z.any()).optional(),
})

export const deleteUserSchema = z.object({
  userId: z.string().min(1),
})
