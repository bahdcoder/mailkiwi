#!/bin/bash

# Define color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Print header
echo -e "${BOLD}${MAGENTA}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${MAGENTA}║                ${CYAN}KIBAMAIL TEST CLEANUP${MAGENTA}                  ║${NC}"
echo -e "${BOLD}${MAGENTA}╚════════════════════════════════════════════════════════╝${NC}"
echo

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${YELLOW}[WARNING]${NC} ${BOLD}Docker is not running. Skipping cleanup.${NC}"
    echo
    echo -e "${MAGENTA}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${MAGENTA}║                ${CYAN}OPERATION COMPLETED${MAGENTA}                     ║${NC}"
    echo -e "${MAGENTA}╚════════════════════════════════════════════════════════╝${NC}"
    exit 0
fi

# Check if containers exist
echo -e "${BLUE}[TASK]${NC} ${BOLD}Checking for test containers...${NC}"
CONTAINERS=$(docker ps -a --filter "name=ansible-" --format "{{.Names}}")

if [ -z "$CONTAINERS" ]; then
    echo -e "${YELLOW}[INFO]${NC} ${BOLD}No test containers found.${NC}"
else
    # Stop and remove containers
    echo -e "${BLUE}[TASK]${NC} ${BOLD}Stopping and removing containers...${NC}"
    for CONTAINER in $CONTAINERS; do
        echo -e "  ${CYAN}•${NC} Removing container: ${YELLOW}$CONTAINER${NC}"
        docker rm -f $CONTAINER > /dev/null 2>&1
    done
    echo -e "${GREEN}[SUCCESS]${NC} ${BOLD}All containers removed.${NC}"
fi

# Remove network if it exists
echo -e "${BLUE}[TASK]${NC} ${BOLD}Checking for test network...${NC}"
if docker network ls | grep -q "kibamail_ansible_network"; then
    echo -e "  ${CYAN}•${NC} Removing network: ${YELLOW}kibamail_ansible_network${NC}"
    docker network rm kibamail_ansible_network > /dev/null 2>&1
    echo -e "${GREEN}[SUCCESS]${NC} ${BOLD}Network removed.${NC}"
else
    echo -e "${YELLOW}[INFO]${NC} ${BOLD}No test network found.${NC}"
fi

# Remove volumes if they exist
echo -e "${BLUE}[TASK]${NC} ${BOLD}Checking for test volumes...${NC}"
VOLUMES=$(docker volume ls --filter "name=docker_" --format "{{.Name}}")

if [ -z "$VOLUMES" ]; then
    echo -e "${YELLOW}[INFO]${NC} ${BOLD}No test volumes found.${NC}"
else
    echo -e "${BLUE}[TASK]${NC} ${BOLD}Removing volumes...${NC}"
    for VOLUME in $VOLUMES; do
        echo -e "  ${CYAN}•${NC} Removing volume: ${YELLOW}$VOLUME${NC}"
        docker volume rm $VOLUME > /dev/null 2>&1
    done
    echo -e "${GREEN}[SUCCESS]${NC} ${BOLD}All volumes removed.${NC}"
fi

echo
echo -e "${GREEN}[SUCCESS]${NC} ${BOLD}Cleanup completed successfully!${NC}"
echo

# Print footer
echo -e "${MAGENTA}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}║                ${CYAN}OPERATION COMPLETED${MAGENTA}                     ║${NC}"
echo -e "${MAGENTA}╚════════════════════════════════════════════════════════╝${NC}"

exit 0
