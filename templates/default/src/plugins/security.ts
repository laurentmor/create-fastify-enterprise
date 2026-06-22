// SPDX-FileCopyrightText: __YEAR__ __AUTHOR__
// __SPDX_ID_LINE__

import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import sensible from '@fastify/sensible';
import underPressure from '@fastify/under-pressure';
import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import mongoose from 'mongoose';

export default fp(
  async function securityPlugin(fastify: FastifyInstance) {
    await fastify.register(helmet, { global: true });

    const origin =
      fastify.config.CORS_ORIGIN === '*' ? true : fastify.config.CORS_ORIGIN.split(',');
    await fastify.register(cors, { origin });

    await fastify.register(sensible);

    await fastify.register(rateLimit, {
      max: fastify.config.RATE_LIMIT_MAX,
      timeWindow: fastify.config.RATE_LIMIT_WINDOW,
    });

    await fastify.register(underPressure, {
      maxEventLoopDelay: 1000,
      maxHeapUsedBytes: 1_000_000_000,
      maxRssBytes: 1_500_000_000,
      // Pings Mongo so a wedged connection (socket open, server not
      // actually responding) fails /health/pressure even when the event
      // loop itself is fine. `db` is undefined before the first
      // connection attempt, which is the skipDb / unit-test case — treated
      // as healthy since no DB was ever expected to be there.
      healthCheck: async () => {
        if (!mongoose.connection.db) return true;
        await mongoose.connection.db.admin().ping();
        return true;
      },
      healthCheckInterval: 5000,
      exposeStatusRoute: '/health/pressure',
    });
  },
  { name: 'security', dependencies: ['env'] },
);
