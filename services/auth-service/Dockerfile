# ============================================================
# Auth Service — Multi-stage Dockerfile
# ============================================================

# ── Stage 1: Base ──────────────────────────────────────────
FROM node:20-alpine AS base

LABEL maintainer="CloudCart Team"
LABEL description="Auth Service - JWT Authentication"
LABEL version="1.0.0"

RUN apk add --no-cache curl dumb-init

WORKDIR /app

# Copy package files for dependency caching
COPY package*.json ./

# ── Stage 2: Dependencies ─────────────────────────────────
FROM base AS dependencies

RUN npm ci --only=production && \
    cp -R node_modules /production_modules

RUN npm ci

# ── Stage 3: Development ──────────────────────────────────
FROM base AS development

COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

USER appuser

EXPOSE 4001

HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=10s \
    CMD curl -f http://localhost:4001/health || exit 1

CMD ["dumb-init", "npx", "nodemon", "src/server.js"]

# ── Stage 4: Production ───────────────────────────────────
FROM base AS production

ENV NODE_ENV=production

COPY --from=dependencies /production_modules ./node_modules
COPY . .

# Remove unnecessary files
RUN rm -rf tests/ .eslintrc.js .prettierrc

# Create non-root user
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

USER appuser

EXPOSE 4001

HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=10s \
    CMD curl -f http://localhost:4001/health || exit 1

CMD ["dumb-init", "node", "src/server.js"]
