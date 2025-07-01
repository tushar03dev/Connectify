# --- Step 1: Build the Next.js app ---
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files first to optimize caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app
COPY . .

# Set production environment
ENV NODE_ENV=production

# Build the app
RUN npm run build

# --- Step 2: Run the Next.js app ---
FROM node:18-alpine AS runner

WORKDIR /app

# Install only production dependencies (optional if your build has external dependencies)
COPY --from=builder /app/package*.json ./
RUN npm install --omit=dev

# Copy built app from builder
COPY --from=builder /app/.next .next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/.env.production ./

# Expose port and start the server
EXPOSE 3000

CMD ["npm", "start"]
