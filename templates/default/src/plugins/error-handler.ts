// SPDX-FileCopyrightText: __YEAR__ __AUTHOR__
// __SPDX_ID_LINE__

import type { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';

interface ApiErrorBody {
  statusCode: number;
  error: string;
  message: string;
  code?: string;
}

/**
 * Centralised error formatting so every error response (validation,
 * thrown app errors, unexpected exceptions) has a single predictable shape,
 * documented once in the OpenAPI error schema instead of per-route.
 */
export default fp(async function errorHandlerPlugin(fastify: FastifyInstance) {
  fastify.setErrorHandler((error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
    const statusCode = error.statusCode ?? 500;

    if (statusCode >= 500) {
      request.log.error({ err: error }, 'Unhandled error');
    } else {
      request.log.warn({ err: error }, 'Request error');
    }

    const body: ApiErrorBody = {
      statusCode,
      error: error.name || 'Error',
      message: statusCode >= 500 ? 'Internal Server Error' : error.message,
      ...(error.code ? { code: error.code } : {}),
    };

    void reply.status(statusCode).send(body);
  });

  fastify.setNotFoundHandler((request: FastifyRequest, reply: FastifyReply) => {
    void reply.status(404).send({
      statusCode: 404,
      error: 'Not Found',
      message: `Route ${request.method} ${request.url} not found`,
    } satisfies ApiErrorBody);
  });
});
