# Build context MUST be the repo root (npm workspaces need packages/shared + packages/ui alongside
# this app's package.json to resolve @stolpi/* links) — see DEPLOY.md for the exact Railway setting.
FROM node:20-slim AS build
WORKDIR /repo
COPY package.json package-lock.json ./
COPY packages ./packages
COPY apps/api ./apps/api
RUN npm install
RUN npm run build --workspace=@stolpi/api

FROM node:20-slim AS runtime
WORKDIR /repo
ENV NODE_ENV=production
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/packages ./packages
COPY --from=build /repo/apps/api ./apps/api
WORKDIR /repo/apps/api
EXPOSE 4000
# db push (not migrate deploy): no migration-history files exist yet — the demo database is only
# reachable from inside Railway's network, so schema sync happens here at container start using the
# internal DATABASE_URL, not from a developer machine. Switch to migrate dev/deploy once the schema
# has stabilized and direct Postgres access (e.g. via Railway's public proxy) is worth enabling.
CMD ["sh", "-c", "npx prisma db push --accept-data-loss --skip-generate && node dist/index.js"]
