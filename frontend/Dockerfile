# ============================================================
# Frontend — Multi-stage Dockerfile
# ============================================================

FROM node:20-alpine AS base

WORKDIR /app
COPY package*.json ./

# ── Development ────────────────────────────────────────────
FROM base AS development

RUN npm install
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]

# ── Build ──────────────────────────────────────────────────
FROM base AS build

RUN npm ci
COPY . .
RUN npm run build

# ── Production ─────────────────────────────────────────────
FROM nginx:1.25-alpine AS production

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

RUN chown -R nginx:nginx /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
