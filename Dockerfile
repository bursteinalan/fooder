# Use Node.js LTS
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN cd backend && npm ci --only=production
RUN cd frontend && npm ci

# Copy source code
COPY backend ./backend
COPY frontend ./frontend

# Build frontend
RUN cd frontend && npm run build

# Build backend
RUN cd backend && npm run build

# Expose port (Cloud Run will set PORT env var)
EXPOSE 8080

# Start the server
CMD ["node", "backend/dist/index.js"]
