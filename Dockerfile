# Use Node.js LTS
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install ALL dependencies (including dev dependencies for build)
RUN cd backend && npm ci
RUN cd frontend && npm ci

# Copy source code
COPY backend ./backend
COPY frontend ./frontend

# Remove any existing build artifacts to ensure clean build
RUN rm -rf frontend/dist backend/dist

# Build frontend (will use empty VITE_API_BASE_URL since .env is ignored)
RUN cd frontend && npm run build

# Build backend
RUN cd backend && npm run build

# Remove dev dependencies to reduce image size
RUN cd backend && npm prune --production

# Set default port (Cloud Run will override this)
ENV PORT=8080

# Expose port (Cloud Run will set PORT env var)
EXPOSE 8080

# Start the server
CMD ["node", "backend/dist/index.js"]
