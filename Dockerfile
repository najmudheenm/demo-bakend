# Use Node.js LTS
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Install curl for health checks
RUN apk --no-cache add curl

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Create SSL directory
RUN mkdir -p /app/ssl

# Copy app source
COPY src/ ./src/

# Copy SSL certificates (will be mounted as volume in docker-compose)
# This is just a fallback in case the volume mount fails
COPY ssl/ /app/ssl/

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Expose the port the app runs on
EXPOSE 3001

# Command to run the application
CMD ["node", "src/index.js"]
