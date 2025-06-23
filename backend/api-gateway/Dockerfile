FROM node:18-alpine

# Set working directory inside container
WORKDIR /app

# Copy dependency files and install
COPY package*.json ./
RUN npm install

# Copy application source code
COPY . .

# Expose the app port
EXPOSE 5000

# Start the server
CMD ["npm", "run", "dev"]
