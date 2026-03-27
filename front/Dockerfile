# Stage 1: Dependencies
FROM node:22-alpine AS deps

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Stage 2: Builder
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 3: Runner (production)
FROM node:22-alpine AS runner

WORKDIR /app

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Environment variables
ENV NODE_ENV=production
ENV PORT=4000

# Expose port
EXPOSE 4000

# Set proper permissions for static files
RUN chmod -R 755 /app/public 2>/dev/null || true

# Switch to non-root user
USER nextjs

# Start the application
CMD ["node", "server.js"]