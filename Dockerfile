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

# Remove any existing build artifacts AND .env files to ensure clean build
RUN rm -rf frontend/dist backend/dist frontend/.env frontend/.env.local frontend/.env.production

# Verify .env is gone
RUN ls -la frontend/ | grep -E "\.env" || echo "No .env files found - good!"

# Build frontend (will use empty VITE_API_BASE_URL since .env is removed)
RUN cd frontend && npm run build

# Verify the build output doesn't contain localhost
RUN grep -r "localhost:3000" frontend/dist/ && echo "ERROR: localhost found in build!" && exit 1 || echo "Build is clean - no localhost references"

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
