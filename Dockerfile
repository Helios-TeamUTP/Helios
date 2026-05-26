# HELIOS Sprint 1 — Dockerfile para Railway
# Build con Node 22 + pnpm via corepack, sirve el dist con vite preview

FROM node:22-alpine AS builder

# Argumentos de build (Railway los pasa automáticamente desde variables)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

RUN corepack enable && corepack prepare pnpm@9.3.0 --activate

WORKDIR /app/frontend

# Cachear el install si package.json no cambió
COPY frontend/package.json ./
RUN pnpm install --frozen-lockfile=false

# Build
COPY frontend/ ./
RUN pnpm build

# Imagen final mínima
FROM node:22-alpine AS runner

RUN corepack enable && corepack prepare pnpm@9.3.0 --activate

WORKDIR /app/frontend

# Solo copiamos lo necesario para preview
COPY --from=builder /app/frontend/package.json ./
COPY --from=builder /app/frontend/dist ./dist
COPY --from=builder /app/frontend/node_modules ./node_modules
COPY --from=builder /app/frontend/vite.config.ts ./

ENV NODE_ENV=production
EXPOSE 4173

CMD ["sh", "-c", "pnpm vite preview --host 0.0.0.0 --port ${PORT:-4173}"]
