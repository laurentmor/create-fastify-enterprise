<!--
SPDX-FileCopyrightText: 2025 Your Org
SPDX-License-Identifier: MIT
-->

# create-fastify-enterprise

Scaffold an enterprise-grade [Fastify](https://fastify.dev) service —
TypeBox-typed routes, Mongoose/MongoDB, OpenAPI docs, CI, release
automation, and license compliance already wired together — with one
command.

```bash
bunx create-fastify-enterprise my-service
# or: npx create-fastify-enterprise my-service
# or: pnpm dlx create-fastify-enterprise my-service
```

Answer a few prompts (or pass flags to skip them) and you get a runnable
Fastify + MongoDB API with:

- **Fastify 5 + TypeBox** — one schema gives you request validation,
  response serialization, full TypeScript inference, *and* the OpenAPI
  document.
- **Mongoose**, connection lifecycle tied to Fastify's start/close hooks.
- **OpenAPI 3** served at `/docs`, plus a static `openapi/openapi.json`
  export script.
- **Vault-ready** secrets — the app just reads env vars, so a `.env` file
  locally and a Vault Agent in production are interchangeable. Optional
  `.vault/` example config (agent config, policy, consul-template).
- **GitHub Actions** CI (lint, typecheck, test+coverage, build, OpenAPI
  validation) and a **Release Please** workflow for changelog-driven
  releases.
- **Husky + Commitlint** (Conventional Commits) and **ESLint + Prettier**,
  pre-wired with a `prepare` script so hooks are live after install.
- **REUSE/SPDX** license compliance — every file carries (or inherits) a
  proper SPDX header from the moment it's generated.
- **Vitest + coverage**, with CI using a real MongoDB service container so
  test runs don't depend on downloading a `mongod` binary.

## Usage

```bash
create-fastify-enterprise [project-name] [options]
```

| Flag | Description |
| --- | --- |
| `-l, --license <id>` | `MIT` \| `Apache-2.0` \| `UNLICENSED` |
| `-p, --package-manager <pm>` | `bun` \| `npm` \| `pnpm` |
| `-a, --author <name>` | Author/organization for LICENSE + SPDX headers |
| `--no-sample` | Omit the sample `users` CRUD module (keeps health check + infra) |
| `--no-vault` | Omit the `.vault/` example config |
| `--no-install` | Skip dependency installation |
| `--no-git` | Skip `git init` |
| `-y, --yes` | Accept defaults for anything not passed as a flag |

Run without a project name or flags for an interactive prompt flow.

### Examples

```bash
# Fully interactive
create-fastify-enterprise

# Non-interactive, CI-friendly
create-fastify-enterprise my-service --license Apache-2.0 --package-manager pnpm \
  --author "Acme Inc" --no-git --yes

# Minimal: just the health check + infra, no sample module, no Vault example
create-fastify-enterprise my-service --no-sample --no-vault --yes
```

## What you get

```
my-service/
  src/
    app.ts                # builds the Fastify instance (shared by server.ts and tests)
    server.ts              # process entrypoint: listen + graceful shutdown
    config/env.ts            # environment schema + validation
    lib/                      # small shared helpers (logger config, ...)
    plugins/                   # mongoose, swagger, security, error handling
    modules/
      health/                   # liveness/readiness route
      users/                     # sample CRUD module (model, schema, service, routes)
  test/                       # Vitest specs mirroring src/modules/**
  .github/workflows/         # CI, Release Please
  .vault/                   # example Vault Agent config (if enabled)
  LICENSES/, REUSE.toml    # REUSE/SPDX license metadata
  Dockerfile, docker-compose.yml
```

See the generated project's own `README.md` for the full rundown of
scripts, environment variables, and architecture once it's scaffolded.

## Local development on this CLI

```bash
bun install
bun run dev -- my-test-app --yes   # scaffold into ./my-test-app
bun run typecheck
bun run lint
bun run build                       # bundles src/index.ts -> dist/index.js
```

`templates/default/` is copied (with placeholder substitution) into every
generated project — see `src/generator/index.ts`. Files that would
otherwise be mangled by tooling running over *this* repo (a literal
`.gitignore` or a nested `REUSE.toml`) are stored with a leading
underscore (`_dot_gitignore`, `_REUSE.toml`) and renamed back on
generation.

## License

MIT — see [`LICENSE`](./LICENSE).
