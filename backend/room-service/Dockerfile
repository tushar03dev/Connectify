# Stage 1: Build TypeScript
FROM node:18 AS builder

# Create app directory
WORKDIR /app

# Copy package files and install deps
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Compile TypeScript
RUN npm run build

# Stage 2: Production image
FROM node:18-slim

# Set working directory
WORKDIR /src

# Only copy compiled output and necessary files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Install devs
RUN npm install

# App port
EXPOSE 5002

# Start app
CMD ["npm", "start"]
