# SPDX-FileCopyrightText: __YEAR__ __AUTHOR__
# __SPDX_ID_LINE__
#
# Multi-stage build. Copies the whole context before installing rather than
# cherry-picking lockfiles, so it works the same regardless of which package
# manager (__PACKAGE_MANAGER__) you scaffolded with.

# ---- build -------------------------------------------------------------
FROM node:20-slim AS build
WORKDIR /app
COPY . .

# [[FEATURE:pmNpm:start]]
RUN npm ci && npm run build && npm prune --omit=dev
# [[FEATURE:pmNpm:end]]
# [[FEATURE:pmPnpm:start]]
RUN corepack enable \
  && pnpm install --frozen-lockfile \
  && pnpm run build \
  && pnpm prune --prod
# [[FEATURE:pmPnpm:end]]
# [[FEATURE:pmBun:start]]
COPY --from=oven/bun:1 /usr/local/bin/bun /usr/local/bin/bun
RUN bun install --frozen-lockfile \
  && bun run build \
  && rm -rf node_modules \
  && bun install --frozen-lockfile --production
# [[FEATURE:pmBun:end]]

# ---- runtime -------------------------------------------------------------
FROM node:20-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs fastify

COPY --from=build --chown=fastify:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=fastify:nodejs /app/dist ./dist
COPY --from=build --chown=fastify:nodejs /app/package.json ./package.json

USER fastify
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/server.js"]
