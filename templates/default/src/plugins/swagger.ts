// SPDX-FileCopyrightText: __YEAR__ __AUTHOR__
// __SPDX_ID_LINE__

import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

/**
 * Registers OpenAPI (3.0) generation via @fastify/swagger, fed entirely by
 * the TypeBox schemas already attached to each route. No schema is
 * duplicated: change a route's TypeBox schema and the OpenAPI document
 * updates automatically.
 *
 * Docs UI:    GET /docs
 * Raw spec:   GET /docs/json  (also exported statically by `npm run openapi:generate`)
 */
export default fp(async function swaggerPlugin(fastify: FastifyInstance) {
  await fastify.register(swagger, {
    openapi: {
      openapi: '3.0.3',
      info: {
        title: '__PROJECT_NAME__',
        description: 'API documentation generated from TypeBox route schemas.',
        version: '0.1.0',
      },
      servers: [{ url: '/', description: 'current host' }],
      tags: [
        { name: 'health', description: 'Liveness / readiness probes' },
        // [[FEATURE:sampleModule:start]]
        { name: 'users', description: 'User management' },
        // [[FEATURE:sampleModule:end]]
      ],
    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: { docExpansion: 'list', deepLinking: true },
  });
});
