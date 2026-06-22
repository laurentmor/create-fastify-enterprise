// SPDX-FileCopyrightText: __YEAR__ __AUTHOR__
// __SPDX_ID_LINE__

import Fastify, { type FastifyInstance, type FastifyServerOptions } from 'fastify';
import envPlugin from './config/env.js';
import { buildLoggerOptions } from './lib/logger.js';
import errorHandlerPlugin from './plugins/error-handler.js';
import mongoosePlugin from './plugins/mongoose.js';
import securityPlugin from './plugins/security.js';
import swaggerPlugin from './plugins/swagger.js';
import { healthRoutes } from './modules/health/health.routes.js';
// [[FEATURE:sampleModule:start]]
import { userRoutes } from './modules/users/user.routes.js';
// [[FEATURE:sampleModule:end]]

export interface BuildAppOptions {
  /** Skip connecting to MongoDB — used by unit tests that don't need a DB. */
  skipDb?: boolean;
  fastifyOptions?: FastifyServerOptions;
}

/**
 * Builds (but does not start listening) a fully configured Fastify
 * instance. Kept separate from server.ts so tests can build an app with
 * fastify.inject() without binding a real port.
 */
export async function buildApp(options: BuildAppOptions = {}): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger: buildLoggerOptions(),
    // Comfortably longer than mongoose.ts's 10s serverSelectionTimeoutMS,
    // so a real "can't reach MongoDB" error surfaces instead of avvio's
    // generic (and much less actionable) "plugin did not start in time".
    pluginTimeout: 15_000,
    ...options.fastifyOptions,
  });

  await fastify.register(envPlugin);

  if (!options.skipDb) {
    await fastify.register(mongoosePlugin);
  }

  await fastify.register(securityPlugin);
  await fastify.register(swaggerPlugin);
  await fastify.register(errorHandlerPlugin);

  await fastify.register(healthRoutes, { prefix: '/health' });
  // [[FEATURE:sampleModule:start]]
  await fastify.register(userRoutes, { prefix: '/users' });
  // [[FEATURE:sampleModule:end]]

  return fastify;
}
