# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Build application
RUN npm run build

# Stage 2: Production
FROM node:22-alpine

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Create directories for uploads and files
RUN mkdir -p /app/public/uploads /app/files

# Copy public assets
COPY public/ ./public/

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "dist/main"]
