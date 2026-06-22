// SPDX-FileCopyrightText: __YEAR__ __AUTHOR__
// __SPDX_ID_LINE__

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { buildApp } from '../src/app.js';

/**
 * Exports the live OpenAPI document to openapi/openapi.json without
 * starting a listening server. Useful for committing a versioned spec,
 * feeding contract-testing tools, or publishing to an API gateway /
 * developer portal in CI.
 *
 * Usage: npm run openapi:generate
 */
async function main(): Promise<void> {
  const app = await buildApp({ skipDb: true, fastifyOptions: { logger: false } });
  await app.ready();

  const spec = app.swagger();
  const outDir = path.resolve(import.meta.dirname, '..', 'openapi');
  await mkdir(outDir, { recursive: true });
  await writeFile(path.join(outDir, 'openapi.json'), JSON.stringify(spec, null, 2), 'utf8');

  await app.close();
  console.log(`OpenAPI document written to ${path.join('openapi', 'openapi.json')}`);
}

void main();
