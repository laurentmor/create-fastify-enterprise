// SPDX-FileCopyrightText: __YEAR__ __AUTHOR__
// __SPDX_ID_LINE__

import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import type { FastifyInstance } from 'fastify';
import {
  createUserBodySchema,
  errorResponseSchema,
  listUsersQuerySchema,
  listUsersResponseSchema,
  updateUserBodySchema,
  userParamsSchema,
  userResponseSchema,
} from './user.schema.js';
import { userService } from './user.service.js';

interface MongoDuplicateKeyError extends Error {
  code?: number;
}

function isDuplicateKeyError(error: unknown): error is MongoDuplicateKeyError {
  return error instanceof Error && (error as MongoDuplicateKeyError).code === 11000;
}

export function userRoutes(fastify: FastifyInstance): void {
  const app = fastify.withTypeProvider<TypeBoxTypeProvider>();

  app.get(
    '/',
    {
      schema: {
        tags: ['users'],
        summary: 'List users (paginated)',
        querystring: listUsersQuerySchema,
        response: { 200: listUsersResponseSchema },
      },
    },
    async (request) => {
      const page = request.query.page ?? 1;
      const limit = request.query.limit ?? 20;
      const { data, total } = await userService.list(page, limit);
      return { data, page, limit, total };
    },
  );

  app.get(
    '/:id',
    {
      schema: {
        tags: ['users'],
        summary: 'Get a user by id',
        params: userParamsSchema,
        response: { 200: userResponseSchema, 404: errorResponseSchema },
      },
    },
    async (request, reply) => {
      const user = await userService.findById(request.params.id);
      if (!user) {
        return reply.notFound(`User ${request.params.id} not found`);
      }
      return user;
    },
  );

  app.post(
    '/',
    {
      schema: {
        tags: ['users'],
        summary: 'Create a user',
        body: createUserBodySchema,
        response: { 201: userResponseSchema, 409: errorResponseSchema },
      },
    },
    async (request, reply) => {
      try {
        const user = await userService.create(request.body);
        return await reply.status(201).send(user);
      } catch (error) {
        if (isDuplicateKeyError(error)) {
          return reply.conflict(`Email ${request.body.email} is already in use`);
        }
        throw error;
      }
    },
  );

  app.patch(
    '/:id',
    {
      schema: {
        tags: ['users'],
        summary: 'Update a user',
        params: userParamsSchema,
        body: updateUserBodySchema,
        response: { 200: userResponseSchema, 404: errorResponseSchema, 409: errorResponseSchema },
      },
    },
    async (request, reply) => {
      try {
        const user = await userService.update(request.params.id, request.body);
        if (!user) {
          return reply.notFound(`User ${request.params.id} not found`);
        }
        return user;
      } catch (error) {
        if (isDuplicateKeyError(error)) {
          return reply.conflict('Email is already in use');
        }
        throw error;
      }
    },
  );

  app.delete(
    '/:id',
    {
      schema: {
        tags: ['users'],
        summary: 'Delete a user',
        params: userParamsSchema,
        response: { 204: Type.Null(), 404: errorResponseSchema },
      },
    },
    async (request, reply) => {
      const removed = await userService.remove(request.params.id);
      if (!removed) {
        return reply.notFound(`User ${request.params.id} not found`);
      }
      return reply.status(204).send(null);
    },
  );
}
