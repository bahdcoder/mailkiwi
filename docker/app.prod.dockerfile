# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package.json and pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install

# Copy the rest of the application code
COPY . .

# Build the application
RUN pnpm quick:build

# Production stage
FROM node:22-alpine

WORKDIR /app

# Copy only the build output from the builder stage
COPY --from=builder /app/build ./build

# Set the command to run the application
CMD ["pnpm", "staging:start"]
