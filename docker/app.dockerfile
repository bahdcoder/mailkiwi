FROM node:22-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package.json and pnpm-lock.yaml
COPY package.json pnpm-lock.yaml .npmrc ./

# Install dependencies
RUN pnpm install

CMD ["pnpm", "coder:dev"]
