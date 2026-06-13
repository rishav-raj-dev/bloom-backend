# ---- Stage 1: Install all dependencies ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ---- Stage 2: Build ----
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# prisma.config.ts validates DATABASE_URL at config-load time even for generate.
# Supply a dummy value — generate reads the schema only, never connects.
ARG DATABASE_URL=postgresql://dummy:dummy@localhost:5432/dummy
ENV DATABASE_URL=${DATABASE_URL}
RUN npx prisma generate
# Compile TypeScript → dist/
RUN npm run build

# ---- Stage 3: Production ----
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production

# Install production dependencies + prisma CLI for migrations
COPY package*.json ./
RUN npm ci --omit=dev && npm install prisma --no-save && npm cache clean --force

# Copy compiled app
COPY --from=builder /app/dist ./dist

# Copy generated Prisma client (output = ../src/generated/prisma in schema)
COPY --from=builder /app/src/generated ./src/generated

# Copy Prisma schema + migrations (needed by migrate deploy)
COPY --from=builder /app/prisma ./prisma

# Prisma 7 reads datasource URL from prisma.config.ts, not schema.prisma
COPY --from=builder /app/prisma.config.ts ./

EXPOSE 8000

COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

ENTRYPOINT ["./entrypoint.sh"]
