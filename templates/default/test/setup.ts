// SPDX-FileCopyrightText: __YEAR__ __AUTHOR__
// __SPDX_ID_LINE__

// Baseline env for every test file, so env validation (src/config/env.ts)
// passes even for tests that build the app with `skipDb: true` and never
// touch Mongo. Tests that need a *real* database override MONGO_URI
// themselves — see test/test-utils.ts — before this value is ever read.
process.env.NODE_ENV ??= 'test';
process.env.LOG_LEVEL ??= 'silent';
process.env.MONGO_URI ??= 'mongodb://127.0.0.1:27017/test-placeholder';
process.env.CORS_ORIGIN ??= '*';
