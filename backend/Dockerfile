# ---- Stage 1: Build ----
# We use alpine for a smaller final image footprint.
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests first so Docker can cache the npm install layer
# separately from the source code layer. This means rebuilds only reinstall
# deps when package.json actually changes.
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

# Now copy the rest of the source and compile TypeScript
COPY tsconfig.json ./
COPY src/ ./src/

RUN npm run build

# ---- Stage 2: Production ----
FROM node:20-alpine AS production

# Security: don't run the container as root
RUN addgroup -S flashpass && adduser -S flashpass -G flashpass

WORKDIR /app

# Only install production dependencies — no dev tooling in the final image
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --ignore-scripts

# Pull in the compiled JS from the builder stage
COPY --from=builder /app/dist ./dist

# Lua scripts and SQL migrations need to ship with the image too
COPY src/redis/lua/ ./dist/redis/lua/
COPY src/database/migrations/ ./dist/database/migrations/

# Drop to non-root user
USER flashpass

EXPOSE 4000

# Health check — hit the /api/admin/health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/api/admin/health || exit 1

CMD ["node", "dist/index.js"]
