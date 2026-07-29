# ============================================
# مواشي البحرين - API Server Dockerfile
# Updated: 2026-07-25 (force cache rebuild)
# ============================================

FROM node:22-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy all workspace files
COPY . .

# Install ALL workspace dependencies (required for shared libs)
RUN pnpm install

# Build the API server
RUN pnpm --filter @workspace/api-server run build

# Production stage
FROM node:22-alpine AS production

# Install dumb-init for proper signal handling and wget for healthcheck
RUN apk add --no-cache dumb-init wget ca-certificates

WORKDIR /app

# Copy built artifacts and node_modules
COPY --from=builder /app/artifacts/api-server/dist ./dist
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
CMD ["dumb-init", "node", "./dist/index.mjs"]
