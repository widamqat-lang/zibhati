# ============================================
# API Server Dockerfile for Railway
# ============================================
FROM node:22-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace files
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY lib ./lib
COPY artifacts/api-server ./artifacts/api-server

# Install dependencies (only for api-server)
RUN pnpm install --filter @workspace/api-server --frozen-lockfile

# Build the API server
RUN pnpm --filter @workspace/api-server run build

# Production stage
FROM node:22-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

WORKDIR /app

# Copy built artifacts
COPY --from=builder /app/artifacts/api-server/dist ./dist

# Copy only the needed node_modules
COPY --from=builder /app/artifacts/api-server/node_modules ./node_modules
COPY --from=builder /app/lib ./lib

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

# Expose port (Railway will set PORT)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-8080}/api/healthz || exit 1

# Start the server
CMD ["sh", "-c", "node ./dist/index.mjs"]
