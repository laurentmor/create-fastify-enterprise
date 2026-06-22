// SPDX-FileCopyrightText: __YEAR__ __AUTHOR__
// __SPDX_ID_LINE__

import type { FastifyServerOptions } from 'fastify';

/**
 * Centralised logger configuration. Kept out of app.ts so the redaction
 * list — the things that must never reach log output or an aggregator —
 * has one obvious home.
 */
export function buildLoggerOptions(): NonNullable<FastifyServerOptions['logger']> {
  const options: NonNullable<FastifyServerOptions['logger']> = {
    level: process.env.LOG_LEVEL ?? 'info',
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'res.headers["set-cookie"]',
        '*.password',
        '*.token',
      ],
      censor: '[redacted]',
    },
  };

  // Under exactOptionalPropertyTypes, `transport` must either be a real
  // value or be absent entirely — never explicitly `undefined`.
  if (process.env.NODE_ENV === 'development') {
    options.transport = { target: 'pino-pretty' };
  }

  return options;
}
