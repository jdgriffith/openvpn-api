# Use official Bun image as base
FROM oven/bun:1 AS base

# Set working directory
WORKDIR /app

# Create app user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 bunuser

# Copy package files
COPY package.json bun.lock* ./

# Install dependencies
RUN bun install --frozen-lockfile --production

# Copy source code
COPY src ./src
COPY tsconfig.json ./

# Change ownership to app user
RUN chown -R bunuser:nodejs /app
USER bunuser

# Expose port
EXPOSE 3000

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Start the application
CMD ["bun", "run", "src/index.ts"]