FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY scripts ./scripts
COPY packages/core/package.json packages/core/package.json
COPY packages/crdt/package.json packages/crdt/package.json
COPY packages/client/package.json packages/client/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY apps/web/package.json apps/web/package.json

RUN npm ci

COPY packages/core packages/core
COPY packages/crdt packages/crdt
COPY packages/client packages/client
COPY packages/ui packages/ui
COPY apps/web apps/web
COPY tsconfig.base.json ./

RUN npm run build -w @colanode/core && \
    npm run build -w @colanode/crdt && \
    npm run build -w @colanode/client && \
    npm run build -w @colanode/ui && \
    npm run build -w @colanode/web

FROM nginx:alpine AS runtime
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
