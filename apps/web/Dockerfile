# Build context MUST be the repo root — see DEPLOY.md. VITE_API_URL is a build ARG because Vite
# inlines import.meta.env.* at build time, not at container start.
FROM node:20-slim AS build
WORKDIR /repo
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
COPY package.json package-lock.json ./
COPY packages ./packages
COPY apps/web ./apps/web
RUN npm install
RUN npm run build --workspace=@stolpi/shared
RUN npm run build --workspace=@stolpi/web

FROM node:20-slim AS runtime
WORKDIR /app
COPY --from=build /repo/apps/web/dist ./dist
EXPOSE 4173
CMD ["sh", "-c", "npx --yes serve -s dist -l ${PORT:-4173}"]
