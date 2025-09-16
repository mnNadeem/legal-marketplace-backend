# Stage 1: Build
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev)
RUN npm ci

# Copy source code
COPY . .

# Build the NestJS app
RUN npm run build

# Stage 2: Production
FROM node:20-alpine
WORKDIR /app

# Copy only package files
COPY package*.json ./
RUN npm ci --only=production

# Copy built files
COPY --from=builder /app/dist ./dist

# Create uploads directory
RUN mkdir -p uploads

EXPOSE 3000
ENV NODE_ENV=production
CMD ["node", "dist/main.js"]
