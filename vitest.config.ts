// SPDX-FileCopyrightText: 2025 Your Org
// SPDX-License-Identifier: MIT

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // templates/default is itself a (separate) project with its own
    // test/**/*.test.ts files and its own vitest.config.ts — vitest's
    // default glob would otherwise pick those up too and fail trying to
    // resolve their dependencies against *this* package's node_modules.
    include: ['test/**/*.test.ts'],
    exclude: ['templates/**', 'node_modules/**', 'dist/**'],
    testTimeout: 20_000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: ['templates/**'],
    },
  },
});
