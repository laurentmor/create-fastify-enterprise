// SPDX-FileCopyrightText: __YEAR__ __AUTHOR__
// __SPDX_ID_LINE__

import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import mongoose from 'mongoose';

declare module 'fastify' {
  interface FastifyInstance {
    mongoose: typeof mongoose;
  }
}

/**
 * Connects Mongoose using fastify.config.MONGO_URI and decorates the
 * instance with the mongoose handle. Connection lifecycle is tied to the
 * Fastify instance via onClose, so tests using fastify.inject() and a real
 * server both shut down cleanly.
 */
export default fp(
  async function mongoosePlugin(fastify: FastifyInstance) {
    mongoose.set('strictQuery', true);

    // A shorter, explicit timeout than the driver's 30s default: fails
    // fast and predictably (important for CI and for orchestrators that
    // restart a crash-looping container) and stays comfortably inside
    // app.ts's pluginTimeout, so *this* error — not avvio's generic
    // "plugin did not start in time" — is what actually surfaces.
    await mongoose.connect(fastify.config.MONGO_URI, { serverSelectionTimeoutMS: 10_000 });

    fastify.decorate('mongoose', mongoose);

    fastify.addHook('onClose', async () => {
      await mongoose.disconnect();
    });

    fastify.log.info('MongoDB connected');
  },
  { name: 'mongoose', dependencies: ['env'] },
);
