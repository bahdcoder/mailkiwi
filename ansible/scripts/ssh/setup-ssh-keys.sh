#!/bin/bash

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${BOLD}${MAGENTA}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${MAGENTA}║                ${CYAN}KIBAMAIL SSH KEY GENERATOR${MAGENTA}               ║${NC}"
echo -e "${BOLD}${MAGENTA}╚════════════════════════════════════════════════════════╝${NC}"
echo

mkdir -p .ssh

if [ -f tests/.ssh/kibamail-test ]; then
    echo -e "${YELLOW}[INFO]${NC} ${BOLD}SSH key already generated.${NC}"
    echo -e "${GREEN}[SUCCESS]${NC} ${BOLD}Exiting...${NC}"
    exit 0
fi

echo -e "${BLUE}[TASK]${NC} ${BOLD}Generating new ED25519 SSH key pair...${NC}"
ssh-keygen -t ed25519 -C "engineering@kibamail.com" -f .ssh/kibamail-test -N ""
echo

echo -e "${GREEN}[SUCCESS]${NC} ${BOLD}SSH key generated successfully!${NC}"
echo -e "  ${CYAN}•${NC} Private key: ${YELLOW}.ssh/kibamail-test${NC}"
echo -e "  ${CYAN}•${NC} Public key:  ${YELLOW}.ssh/kibamail-test.pub${NC}"
echo

echo -e "${MAGENTA}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}║                ${CYAN}OPERATION COMPLETED${MAGENTA}                     ║${NC}"
echo -e "${MAGENTA}╚════════════════════════════════════════════════════════╝${NC}"
