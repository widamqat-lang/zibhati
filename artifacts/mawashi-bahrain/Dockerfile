# ============================================
# Frontend Dockerfile for Railway
# ============================================
FROM node:22-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace files
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY lib ./lib
COPY artifacts/mawashi-bahrain ./artifacts/mawashi-bahrain

# Set environment variables for build
ENV NODE_ENV=production
ENV PORT=8080
ENV BASE_PATH=/

# Install dependencies (only for frontend)
RUN pnpm install --filter @workspace/mawashi-bahrain --frozen-lockfile

# Build the frontend
RUN pnpm --filter @workspace/mawashi-bahrain run build

# Production stage - serve with serve package
FROM node:22-alpine AS production

WORKDIR /app

# Install serve to serve static files
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install -g serve

# Copy built files
COPY --from=builder /app/artifacts/mawashi-bahrain/dist/public ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

# Expose port (Railway will set PORT)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-8080}/ || exit 1

# Start the server
CMD ["serve", "-s", "./dist", "-l", "${PORT:-8080}"]
