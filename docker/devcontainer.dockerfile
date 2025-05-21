FROM node:22-alpine

# Install essential tools and dependencies
RUN apk add --no-cache \
    git \
    curl \
    wget \
    zsh \
    bash \
    openssh-client \
    python3 \
    make \
    g++ \
    build-base

# Install Oh My Zsh for better terminal experience
RUN sh -c "$(wget -O- https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"

# Install pnpm
RUN npm install -g pnpm@9.7.1

# Set working directory
WORKDIR /app

# Copy package.json and pnpm-lock.yaml
COPY package.json pnpm-lock.yaml .npmrc ./

# Install dependencies
RUN pnpm install

# Set environment variables
# Note: Most environment variables are managed by Infisical
# and injected when running pnpm coder:dev
ENV NODE_ENV=development
ENV KIBAMAIL_CODER_ENVIRONMENT=true

# Command to keep the container running
CMD ["pnpm", "coder:dev"]
