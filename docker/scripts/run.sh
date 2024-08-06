#!/bin/bash

# Change to the directory containing this script
cd "$(dirname "$0")/.."

# build
build() {
    echo "Building the application..."
    docker-compose -f compose.yaml -f compose.dev.yaml run --rm mailkiwi pnpm run build
}

down() {
    echo "Destroying the application environment..."
    docker-compose -f compose.yaml -f compose.dev.yaml down
}

app_build() {
    echo "Building only the app Docker image..."
    docker build -t mailkiwi:latest -f app.dockerfile ..
}

# test
test() {
    echo "Running tests..."
    docker-compose -f compose.yaml -f compose.test.yaml run --rm mailkiwi pnpm test
}

# dev
up() {
    echo "Starting development environment..."
    docker-compose --env-file .env.dev -f compose.yaml -f compose.dev.yaml up -d
}

# Main script to handle different commands
case "$1" in
    build)
        build
        ;;
    app-build)
        app_build
        ;;
    test)
        test
        ;;
    up)
        up
        ;;
    down)
        down
        ;;
    *)
        echo "Usage: $0 {build|test|up|app-build|down}"
        exit 1
esac
