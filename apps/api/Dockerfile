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
CMD ["sh", "-c", "npm run db:deploy && node dist/index.js"]
