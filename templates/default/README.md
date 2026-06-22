<!--
SPDX-FileCopyrightText: __YEAR__ __AUTHOR__
__SPDX_ID_LINE__
-->

# __PROJECT_NAME__

Enterprise-grade Fastify service, scaffolded by
[create-fastify-enterprise](https://github.com/your-org/create-fastify-enterprise).

- **Fastify 5** with the **TypeBox** type provider — one schema gives you
  request validation, response serialization, full TS inference, and the
  OpenAPI document, all from the same object.
- **Mongoose** for MongoDB, with a connection lifecycle wired into Fastify's
  own start/close hooks.
- **Vault-ready**: secrets arrive as plain env vars, so a local `.env` file
  and a Vault Agent in production are interchangeable (see [`.vault/README.md`](./.vault/README.md)).
- **OpenAPI 3** served at `/docs`, plus a static `openapi/openapi.json` export.
- **Vitest** with v8 coverage thresholds enforced in CI.
- **ESLint + Prettier**, **Husky + Commitlint** (Conventional Commits),
  **Release Please**, and **REUSE/SPDX** license compliance, all pre-wired.

## Quick start

```bash
__INSTALL__
cp .env.example .env        # then point MONGO_URI at a running MongoDB
docker compose up -d mongo  # or use your own MongoDB instance
__RUN__ dev
```

The server listens on `http://localhost:3000` by default.

| Endpoint                         | Purpose                                                       |
| -------------------------------- | ------------------------------------------------------------- |
| `GET /health`                    | Liveness + readiness (checks the Mongo connection state)      |
| `GET /docs`                      | Swagger UI                                                    |
| `GET /docs/json`                 | Raw OpenAPI 3 document                                        |
| `GET /users`, `POST /users`, ... | Sample CRUD module (omit at scaffold time with `--no-sample`) |

## Scripts

| Command                           | What it does                                                    |
| --------------------------------- | --------------------------------------------------------------- |
| `__RUN__ dev`                     | Start the API with hot reload (`tsx watch`)                     |
| `__RUN__ build`                   | Type-check and compile to `dist/`                               |
| `__RUN__ start`                   | Run the compiled output (`node dist/server.js`)                 |
| `__RUN__ test` / `test:watch`     | Run the Vitest suite                                            |
| `__RUN__ coverage`                | Run tests with coverage (thresholds enforced)                   |
| `__RUN__ lint` / `lint:fix`       | ESLint                                                          |
| `__RUN__ format` / `format:check` | Prettier                                                        |
| `__RUN__ typecheck`               | `tsc --noEmit`                                                  |
| `__RUN__ openapi:generate`        | Boot the app in-process and write `openapi/openapi.json`        |
| `__RUN__ reuse:lint`              | Verify REUSE/SPDX license compliance (requires the `reuse` CLI) |

## Configuration

All configuration is environment variables, validated at startup against the
TypeBox schema in [`src/config/env.ts`](./src/config/env.ts) — the process
refuses to boot if something required is missing or malformed. See
[`.env.example`](./.env.example) for the full list.

| Variable                               | Default            | Notes                                   |
| -------------------------------------- | ------------------ | --------------------------------------- |
| `NODE_ENV`                             | `development`      | `development` \| `test` \| `production` |
| `HOST`                                 | `0.0.0.0`          |                                         |
| `PORT`                                 | `3000`             |                                         |
| `LOG_LEVEL`                            | `info`             | pino level                              |
| `MONGO_URI`                            | —                  | **required**                            |
| `CORS_ORIGIN`                          | `*`                |                                         |
| `RATE_LIMIT_MAX` / `RATE_LIMIT_WINDOW` | `200` / `1 minute` | global rate limit                       |

## Project layout

```
src/
  app.ts              # builds the Fastify instance (used by both server.ts and tests)
  server.ts            # process entrypoint: listen + graceful shutdown
  config/env.ts         # environment schema + validation
  lib/                  # small shared helpers (logger config, etc.)
  plugins/              # cross-cutting Fastify plugins (mongoose, swagger, security, errors)
  modules/
    health/              # liveness/readiness route
    users/                # sample CRUD module — model, TypeBox schemas, service, routes
test/                   # Vitest specs, mirroring src/modules/**
.github/workflows/      # CI, Release Please
.vault/                  # example Vault Agent config (only if scaffolded with Vault enabled)
LICENSES/, REUSE.toml    # REUSE/SPDX license metadata
```

Each module follows the same shape: a Mongoose **model**, a TypeBox
**schema** (request/response/OpenAPI in one place), a **service** (the only
thing that talks to Mongoose — keeps routes thin and easy to test), and
**routes** that wire schema + service together via the typed Fastify
instance.

## Testing

```bash
__RUN__ test          # one-off
__RUN__ test:watch    # watch mode
__RUN__ coverage      # with coverage; CI enforces the thresholds in vitest.config.ts
```

Route tests build the app with `fastify.inject()` — no real HTTP socket.
The sample `users` tests need a real MongoDB: locally `test/test-utils.ts`
spins one up automatically via `mongodb-memory-server` (downloads a `mongod`
binary on first run — needs outbound network access once, then it's
cached). In CI, a `mongo:7` service container is used instead (see
`.github/workflows/ci.yml`), so pipelines on locked-down runners never
need that download — if `MONGO_URI` is already set, `test-utils.ts` uses
it directly.

## Docker

```bash
docker build -t __PROJECT_NAME__ .
docker compose --profile app --profile vault up
```

The image is a multi-stage build that compiles TypeScript, prunes
dev-dependencies, and runs as a non-root user. See `Dockerfile` and
`docker-compose.yml`.

## Secrets & Vault

The app never imports a Vault client — it just reads `process.env`. Locally
that's `.env`; in production it can be a Vault Agent rendering the same
variables to a file, a Kubernetes Secret, or your platform's native
secrets manager. Full walkthrough: [`.vault/README.md`](./.vault/README.md).

## Releases

Commits must follow [Conventional Commits](https://www.conventionalcommits.org/)
(enforced by Husky + Commitlint on every commit). Pushes to `main` let
[Release Please](https://github.com/googleapis/release-please) open a PR
that bumps the version and updates `CHANGELOG.md`; merging it cuts the
release. See `release-please-config.json`.

## License compliance

This project follows the [REUSE specification](https://reuse.software/) —
every file carries (or inherits, via `REUSE.toml`) an `SPDX-License-Identifier`
and copyright line. Run `__RUN__ reuse:lint` to verify. See `CONTRIBUTING.md`
for what that means for new files.

## License

__LICENSE__ — see [`LICENSE`](./LICENSE).
