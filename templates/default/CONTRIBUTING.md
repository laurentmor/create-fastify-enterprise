<!--
SPDX-FileCopyrightText: __YEAR__ __AUTHOR__
__SPDX_ID_LINE__
-->

# Contributing

## Dev workflow

```bash
__INSTALL__
cp .env.example .env
docker compose up -d mongo
__RUN__ dev
```

Before opening a PR:

```bash
__RUN__ lint
__RUN__ typecheck
__RUN__ test
__RUN__ format:check
```

(Husky runs lint + format on staged files automatically at commit time, and
commit message linting at commit-msg time — see below.)

## Commit messages

This repo enforces [Conventional
Commits](https://www.conventionalcommits.org/), checked by Commitlint via a
Husky `commit-msg` hook:

```
<type>(<optional scope>): <description>

[optional body]

[optional footer(s)]
```

Allowed types: `feat`, `fix`, `perf`, `refactor`, `docs`, `style`, `test`,
`build`, `ci`, `chore`, `revert`. Examples:

```
feat(users): add pagination to GET /users
fix(mongoose): close connection on SIGTERM before exiting
docs: clarify Vault Agent setup in README
```

`feat` and `fix` commits drive [Release Please](https://github.com/googleapis/release-please)'s
version bumps and `CHANGELOG.md` entries, so the type matters beyond
passing the lint check — `fix:` becomes a patch release, `feat:` a minor
release, and a `BREAKING CHANGE:` footer (or `!` after the type) a major
one.

## Adding new files: REUSE/SPDX headers

This project follows the [REUSE specification](https://reuse.software/).
Every new file needs a copyright + license tag, either as an in-file header
or as a path-based entry in `REUSE.toml` for formats that can't carry
comments (JSON, lockfiles, binary fixtures, ...).

For source files, add this as the first lines (adjust the comment syntax
to the language):

```ts
// SPDX-FileCopyrightText: __YEAR__ __AUTHOR__
// __SPDX_ID_LINE__
```

For a file type that can't carry a header, add a glob to the appropriate
`[[annotations]]` block in `REUSE.toml` instead. Verify with:

```bash
__RUN__ reuse:lint
```

(requires the [`reuse`](https://github.com/fsfe/reuse-tool) CLI — `pip
install reuse` or `pipx install reuse` — and is also enforced in CI.)

## Code style

ESLint + Prettier are the source of truth, not this document — run
`__RUN__ lint:fix` and `__RUN__ format` rather than hand-formatting. A few
conventions worth knowing going in:

- Each feature module (`src/modules/<name>/`) keeps a **model** (Mongoose),
  a **schema** (TypeBox — request/response/OpenAPI in one place), a
  **service** (the only thing that talks to Mongoose), and **routes**
  (wires schema + service to the typed Fastify instance). Routes should
  stay thin; put logic in the service so it's testable without HTTP.
- Cross-cutting concerns (logging, security headers, error formatting,
  the DB connection) live in `src/plugins/`, each registered once in
  `src/app.ts`.
- Tests mirror `src/modules/**` under `test/modules/**`. Use
  `test/test-utils.ts#buildTestApp()` for anything that touches Mongo;
  it transparently uses the CI Mongo service container when `MONGO_URI`
  is already set, or `mongodb-memory-server` locally otherwise.
