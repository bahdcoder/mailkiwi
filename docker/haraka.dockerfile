FROM node:22

WORKDIR /app

RUN apt-get update && apt-get install -y python3 build-essential

RUN npm install -g pnpm

COPY docker/haraka/package.stub.json ./package.json
COPY docker/haraka/.env-cmdrc ./.env-cmdrc
COPY src/haraka ./haraka

RUN pnpm install --ignore-scripts

RUN pnpm rebuild

RUN ls -la

CMD ["pnpm", "haraka:dev"]
