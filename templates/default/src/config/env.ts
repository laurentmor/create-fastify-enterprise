// SPDX-FileCopyrightText: __YEAR__ __AUTHOR__
// __SPDX_ID_LINE__

import { Type, type Static } from '@sinclair/typebox';
import fastifyEnv from '@fastify/env';
import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

/**
 * Environment schema.
 *
 * Vault-ready: in production, do not bake secrets into the image or commit
 * a `.env` file. Instead run a Vault Agent (see .vault/agent-config.hcl)
 * that renders a templated env file and load it before the process starts:
 *
 *   vault agent -config=.vault/agent-config.hcl &
 *   set -a && source /tmp/__PROJECT_NAME__/app.env && set +a
 *   node dist/server.js
 *
 * (On Kubernetes with the Vault Agent Injector, secrets land at
 * /vault/secrets/app.env by default instead — adjust the source path
 * accordingly. See .vault/README.md for both setups.)
 *
 * This schema does not care where MONGO_URI came from — a local .env file
 * and a Vault-rendered file are both just environment variables to it.
 */
export const envSchema = Type.Object({
  NODE_ENV: Type.Union(
    [Type.Literal('development'), Type.Literal('test'), Type.Literal('production')],
    { default: 'development' },
  ),
  HOST: Type.String({ default: '0.0.0.0' }),
  PORT: Type.Number({ default: 3000 }),
  LOG_LEVEL: Type.Union(
    [
      Type.Literal('fatal'),
      Type.Literal('error'),
      Type.Literal('warn'),
      Type.Literal('info'),
      Type.Literal('debug'),
      Type.Literal('trace'),
      Type.Literal('silent'),
    ],
    { default: 'info' },
  ),
  MONGO_URI: Type.String({ minLength: 1 }),
  CORS_ORIGIN: Type.String({ default: '*' }),
  RATE_LIMIT_MAX: Type.Number({ default: 200 }),
  RATE_LIMIT_WINDOW: Type.String({ default: '1 minute' }),
});

export type Env = Static<typeof envSchema>;

declare module 'fastify' {
  interface FastifyInstance {
    config: Env;
  }
}

export default fp(
  async function envPlugin(fastify: FastifyInstance) {
    await fastify.register(fastifyEnv, {
      schema: envSchema,
      dotenv: true,
      confKey: 'config',
    });
  },
  { name: 'env' },
);
