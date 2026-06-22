// SPDX-FileCopyrightText: __YEAR__ __AUTHOR__
// __SPDX_ID_LINE__

import { Type, type Static } from '@sinclair/typebox';

export const healthResponseSchema = Type.Object({
  status: Type.Literal('ok'),
  uptime: Type.Number({ description: 'Process uptime in seconds' }),
  timestamp: Type.String({ format: 'date-time' }),
  mongo: Type.Union([
    Type.Literal('connected'),
    Type.Literal('disconnected'),
    Type.Literal('skipped'),
  ]),
});

export type HealthResponse = Static<typeof healthResponseSchema>;
