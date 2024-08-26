FROM node:22

WORKDIR /app

RUN apt-get update && apt-get install -y python3 build-essential

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --ignore-scripts

RUN pnpm rebuild

COPY . .

CMD ["pnpm", "haraka:dev"]
