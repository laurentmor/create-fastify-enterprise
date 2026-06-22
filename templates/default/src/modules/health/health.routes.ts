// SPDX-FileCopyrightText: __YEAR__ __AUTHOR__
// __SPDX_ID_LINE__

import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import type { FastifyInstance } from 'fastify';
import mongoose from 'mongoose';
import { healthResponseSchema, type HealthResponse } from './health.schema.js';

/**
 * Liveness / readiness probe, consumed by orchestrators (Kubernetes,
 * ECS, Nomad...) and load balancers. Kept dependency-free of business
 * logic on purpose.
 */
export function healthRoutes(fastify: FastifyInstance): void {
  fastify.withTypeProvider<TypeBoxTypeProvider>().get(
    '/',
    {
      schema: {
        tags: ['health'],
        summary: 'Liveness and readiness probe',
        response: { 200: healthResponseSchema },
      },
    },
    (): HealthResponse => {
      // mongoose is CJS; destructuring a named export (`import { x } from
      // 'mongoose'`) only works when Node's CJS->ESM interop can statically
      // detect it, which it doesn't always do reliably for this package —
      // accessing it off the default import works everywhere.
      const { ConnectionStates } = mongoose;
      const mongoState = mongoose.connection.readyState;
      const mongo: HealthResponse['mongo'] =
        mongoState === ConnectionStates.connected
          ? 'connected'
          : mongoState === ConnectionStates.disconnected
            ? 'skipped'
            : 'disconnected';
      return {
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        mongo,
      };
    },
  );
}
