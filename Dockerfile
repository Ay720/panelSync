# Multi-stage Dockerfile for PanelSync
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root and package manifests
COPY package.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install client dependencies and build frontend
RUN cd client && npm ci
COPY client/ ./client/
RUN cd client && npm run build

# Install server production dependencies
RUN cd server && npm ci --only=production
COPY server/ ./server/

# Stage 2: Minimal Production Runtime
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5001

# Copy built frontend assets and server application
COPY --from=builder /app/server /app/server
COPY --from=builder /app/client/dist /app/client/dist
COPY package.json /app/

EXPOSE 5001

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5001/api/health || exit 1

CMD ["node", "server/src/server.js"]

