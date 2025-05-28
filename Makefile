# Makefile for development tasks

# Set the default shell to bash
SHELL := /bin/bash

# Default target
.DEFAULT_GOAL := help

# docker compose files
COMPOSE_DEV := -f docker/compose.dev.yaml
COMPOSE_CODER := -f docker/compose.coder.yaml
COMPOSE_DEV_ESSENTIAL := -f docker/compose.dev.essential.yaml

# Helper target to print available commands
help:
	@echo "Available commands:"
	@echo "  make build         - Build the application"
	@echo "  make api.dev       - Run the apis in development"
	@echo "  make down          - Destroy the application environment"
	@echo "  make app.build     - Build only the app Docker image"
	@echo "  make up            - Start development environment"
	@echo "  make kumo          - Run KumoMTA dev container with mounted volume"

# Build the application
build:
	@echo "Building the application..."
	docker compose $(COMPOSE_DEV) run --rm kibamail pnpm run build

# Destroy the application environment
down:
	@echo "Destroying the application environment..."
	docker compose $(COMPOSE_DEV) down

coder.down:
	@echo "Destroying the application environment..."
	docker compose $(COMPOSE_CODER) down

down.clean:
	@echo "Destroying the application environment and cleaning volumes..."
	docker compose $(COMPOSE_DEV) down -v

# Build only the app Docker image
app.build:
	@echo "Building only the app Docker image..."
	docker build -t kibamail-dev:latest -f docker/app.dockerfile .

app.build.prod:
	@echo "Building only the app Docker image for production..."
	docker build -t kibamail:latest -f docker/app.prod.dockerfile .

# Run tests
test:
	@echo "Running tests..."
	pnpm test

# Run tests in watch mode
test.watch:
	@echo "Running tests in watch mode..."
	pnpm test:watch

# Run a custom command
run:
	@if [ -z "$(cmd)" ]; then \
		echo "Please provide a command using cmd='your command'"; \
		exit 1; \
	fi
	docker compose $(COMPOSE_DEV) run --rm kibamail pnpm $(cmd)

# Start all services
dev:
	@echo "Starting all services..."
	docker compose $(COMPOSE_DEV) up --wait

dev.essential:
	@echo "starting all essential services..."
	docker compose $(COMPOSE_DEV_ESSENTIAL) up --build --wait

coder.dev:
	@echo "Starting all services..."
	docker compose $(COMPOSE_CODER) up --wait

api.dev:
	pnpm dev

# Run KumoMTA dev container with mounted volume
kumo:
	@echo "Running KumoMTA dev container with mounted policy directory..."
	docker run \
		--add-host=host.docker.internal:host-gateway \
		-e HOSTNAME=kumomta \
		-e API_HTTP_ACCESS_TOKEN=tSv1rimOykRimRB7XgLtYDctSv1rimOykRimRB7XgLtYDc \
		-e API_HTTP_SERVER=http://host.docker.internal:5666 \
		-e TSA_DAEMON_HTTP_SERVER=http://host.docker.internal:8012 \
		-p 6235:8000 \
		-p 5990:25 \
		--network kibamail_default \
		--dns 172.20.0.2 \
		-v $(shell pwd)/kumomta/policy:/opt/kumomta/etc/policy \
		-v $(shell pwd)/kumomta/data:/var/log/kumomta\
		-v $(shell pwd)/kumomta/spool:/var/spool/kumomta\
		ghcr.io/kumocorp/kumomta-dev:latest

.PHONY: help build down app-build app-build-prod test test-watch run dev dev-test kumo api.dev
