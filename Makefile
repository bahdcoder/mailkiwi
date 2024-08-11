# Makefile for development tasks

# Set the default shell to bash
SHELL := /bin/bash

# Default target
.DEFAULT_GOAL := help

# Docker compose files
COMPOSE_DEV := -f docker/compose.yaml -f docker/compose.dev.yaml
COMPOSE_TEST := -f docker/compose.yaml -f docker/compose.test.yaml

# Helper target to print available commands
help:
	@echo "Available commands:"
	@echo "  make build         - Build the application"
	@echo "  make down          - Destroy the application environment"
	@echo "  make app-build     - Build only the app Docker image"
	@echo "  make test          - Run tests"
	@echo "  make test-watch    - Run tests in watch mode"
	@echo "  make up            - Start development environment"
	@echo "  make run-command CMD='your command'  - Run a custom command in the mailkiwi container"

# Build the application
build:
	@echo "Building the application..."
	docker-compose $(COMPOSE_DEV) run --rm mailkiwi pnpm run build

# Destroy the application environment
down:
	@echo "Destroying the application environment..."
	docker-compose $(COMPOSE_DEV) down

# Build only the app Docker image
app-build:
	@echo "Building only the app Docker image..."
	docker build -t mailkiwi-dev:latest -f docker/app.dockerfile .

app-build-prod:
	@echo "Building only the app Docker image for production..."
	docker build -t mailkiwi:latest -f docker/app.prod.dockerfile .

# Run tests
test:
	@echo "Running tests..."
	docker-compose $(COMPOSE_TEST) run --rm mailkiwi pnpm test

# Run tests in watch mode
test-watch:
	@echo "Running tests in watch mode..."
	docker-compose $(COMPOSE_TEST) run --rm mailkiwi pnpm test:watch

# Run tests in watch mode
run:
	@if [ -z "$(cmd)" ]; then \
		echo "Please provide a command using cmd='your command'"; \
		exit 1; \
	fi
	docker-compose $(COMPOSE_DEV) run --rm mailkiwi pnpm $(cmd)

# Start development environment
dev:
	@echo "Starting development environment..."
	docker-compose $(COMPOSE_DEV) up -d

.PHONY: help build down app-build test test-watch up
