# Use Node.js LTS
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy app source
COPY src/ ./src/

# Copy SSL certificates
COPY ssl/ /app/ssl/

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["node", "src/index.js"]
