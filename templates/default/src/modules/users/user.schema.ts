// SPDX-FileCopyrightText: __YEAR__ __AUTHOR__
// __SPDX_ID_LINE__

import { Type, type Static } from '@sinclair/typebox';

const objectIdPattern = '^[0-9a-fA-F]{24}$';

export const userParamsSchema = Type.Object({
  id: Type.String({ pattern: objectIdPattern, description: 'MongoDB ObjectId' }),
});

export const userResponseSchema = Type.Object({
  id: Type.String({ pattern: objectIdPattern }),
  email: Type.String({ format: 'email' }),
  name: Type.String(),
  role: Type.Union([Type.Literal('admin'), Type.Literal('member')]),
  createdAt: Type.String({ format: 'date-time' }),
  updatedAt: Type.String({ format: 'date-time' }),
});

export const createUserBodySchema = Type.Object({
  email: Type.String({ format: 'email' }),
  name: Type.String({ minLength: 1, maxLength: 200 }),
  role: Type.Optional(Type.Union([Type.Literal('admin'), Type.Literal('member')])),
});

export const updateUserBodySchema = Type.Partial(createUserBodySchema);

export const listUsersQuerySchema = Type.Object({
  page: Type.Optional(Type.Integer({ minimum: 1, default: 1 })),
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 20 })),
});

export const listUsersResponseSchema = Type.Object({
  data: Type.Array(userResponseSchema),
  page: Type.Integer(),
  limit: Type.Integer(),
  total: Type.Integer(),
});

export const errorResponseSchema = Type.Object({
  statusCode: Type.Number(),
  error: Type.String(),
  message: Type.String(),
});

export type CreateUserBody = Static<typeof createUserBodySchema>;
export type UpdateUserBody = Static<typeof updateUserBodySchema>;
export type ListUsersQuery = Static<typeof listUsersQuerySchema>;
export type UserResponse = Static<typeof userResponseSchema>;
