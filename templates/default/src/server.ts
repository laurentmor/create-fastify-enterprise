// SPDX-FileCopyrightText: __YEAR__ __AUTHOR__
// __SPDX_ID_LINE__

import closeWithGrace from 'close-with-grace';
import { buildApp } from './app.js';

async function main(): Promise<void> {
  const app = await buildApp();

  closeWithGrace({ delay: 5000 }, async ({ err }: { err?: Error }) => {
    if (err) app.log.error(err, 'Closing app due to error');
    await app.close();
  });

  await app.listen({ host: app.config.HOST, port: app.config.PORT });
}

main().catch((error: unknown) => {
  // Deliberately a plain console.error, not app.log: buildApp() can fail
  // before the logger is fully wired (bad env, unreachable Mongo), so this
  // is the one place in the app that can't assume a working logger exists.
  console.error('Failed to start server:', error);
  process.exit(1);
});
