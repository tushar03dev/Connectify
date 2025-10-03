# Stage 1: Build TypeScript
FROM node:18-alpine AS builder

WORKDIR /app

# Copy only package files first
COPY package*.json ./

# Install dependencies (only needed for build)
RUN npm install

# Copy source code
COPY . .

# Compile TypeScript
RUN npm run build

# Stage 2: Production image
FROM node:18-alpine

WORKDIR /app

# Copy only compiled output and production dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Install only production deps
RUN npm install --production

EXPOSE 5003

CMD ["node", "dist/index.js"]
