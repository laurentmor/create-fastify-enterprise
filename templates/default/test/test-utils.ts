// SPDX-FileCopyrightText: __YEAR__ __AUTHOR__
// __SPDX_ID_LINE__

import { MongoMemoryServer } from 'mongodb-memory-server';
import { buildApp } from '../src/app.js';
import type { FastifyInstance } from 'fastify';

let mongod: MongoMemoryServer | undefined;

/**
 * Spins up a Fastify app pointed at a real MongoDB.
 *
 * If MONGO_URI is already set (CI sets this to the `mongo` service
 * container — see .github/workflows/ci.yml) it's used directly. Otherwise
 * this falls back to mongodb-memory-server for a zero-setup local `npm
 * test`, which downloads a mongod binary on first run — that download can
 * fail behind a restrictive firewall, which is exactly why CI doesn't rely
 * on it.
 */
export async function buildTestApp(): Promise<FastifyInstance> {
  if (!process.env.MONGO_URI) {
    mongod = await MongoMemoryServer.create();
    process.env.MONGO_URI = mongod.getUri();
  }
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = 'silent';

  return buildApp({ fastifyOptions: { logger: false } });
}

export async function closeTestApp(app: FastifyInstance): Promise<void> {
  await app.close();
  await mongod?.stop();
  mongod = undefined;
}
