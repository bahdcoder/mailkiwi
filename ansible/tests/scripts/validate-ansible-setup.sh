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

# Initialize failure flag
FAILURE=0

# Create logs directory if it doesn't exist
mkdir -p tests/logs

# Set up logging
VALIDATION_LOG_FILE="tests/logs/ansible-validation-$(date +%Y-%m-%d-%H-%M-%S).log"
exec > >(tee -a "$VALIDATION_LOG_FILE") 2>&1

# Print header
echo -e "${BOLD}${MAGENTA}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${MAGENTA}║            ${CYAN}KIBAMAIL ANSIBLE VALIDATION${MAGENTA}             ║${NC}"
echo -e "${BOLD}${MAGENTA}╚════════════════════════════════════════════════════════╝${NC}"
echo
echo "Validation log file: $VALIDATION_LOG_FILE"
echo

# Check if ansible-root container is running
echo -e "${BLUE}[TASK]${NC} ${BOLD}Checking if app containers are running...${NC}"
if ! docker ps | grep -q "ansible-app-1" || ! docker ps | grep -q "ansible-app-2"; then
    echo -e "${RED}[ERROR]${NC} ${BOLD}App containers are not running!${NC}"
    echo -e "${YELLOW}[INFO]${NC} ${BOLD}Please run setup-ssh-keys.sh first.${NC}"
    exit 1
fi
echo -e "${GREEN}[SUCCESS]${NC} ${BOLD}App containers are running.${NC}"
echo

# Function to run validation on a container
validate_container() {
    local container=$1
    local failures=0

    echo -e "${BLUE}[VALIDATING]${NC} ${BOLD}Container: ${YELLOW}$container${NC}${BOLD}...${NC}"

    # Check 1: Verify Node.js installation
    echo -e "${CYAN}•${NC} Checking Node.js installation..."
    NODE_VERSION=$(docker exec $container bash -c "export NVM_DIR=\"/root/.nvm\" && [ -s \"\$NVM_DIR/nvm.sh\" ] && . \"\$NVM_DIR/nvm.sh\" && node --version" 2>&1)
    if [[ $NODE_VERSION == v22.4.0 ]]; then
        echo -e "  ${GREEN}✓${NC} Node.js is correctly installed: ${GREEN}$NODE_VERSION${NC}"
    else
        echo -e "  ${RED}✗${NC} Node.js installation failed or wrong version: ${RED}$NODE_VERSION${NC}"
        echo -e "  ${YELLOW}Expected:${NC} v22.4.0"
        ((failures++))
    fi

    # Check 2: Verify NVM installation
    echo -e "${CYAN}•${NC} Checking NVM installation..."
    NVM_VERSION=$(docker exec $container bash -c "export NVM_DIR=\"/root/.nvm\" && [ -s \"\$NVM_DIR/nvm.sh\" ] && . \"\$NVM_DIR/nvm.sh\" && nvm --version" 2>&1)
    if [[ $NVM_VERSION =~ ^0\.39\.[0-9]+$ ]]; then
        echo -e "  ${GREEN}✓${NC} NVM is correctly installed: ${GREEN}$NVM_VERSION${NC}"
    else
        echo -e "  ${RED}✗${NC} NVM installation failed or wrong version: ${RED}$NVM_VERSION${NC}"
        echo -e "  ${YELLOW}Expected:${NC} 0.39.x"
        ((failures++))
    fi

    # Check 3: Verify PNPM installation
    echo -e "${CYAN}•${NC} Checking PNPM installation..."
    PNPM_VERSION=$(docker exec $container bash -c "export NVM_DIR=\"/root/.nvm\" && [ -s \"\$NVM_DIR/nvm.sh\" ] && . \"\$NVM_DIR/nvm.sh\" && pnpm --version" 2>&1)
    if [[ $PNPM_VERSION =~ ^9\.[0-9]+\.[0-9]+$ ]]; then
        echo -e "  ${GREEN}✓${NC} PNPM is correctly installed: ${GREEN}$PNPM_VERSION${NC}"
    else
        echo -e "  ${RED}✗${NC} PNPM installation failed or wrong version: ${RED}$PNPM_VERSION${NC}"
        echo -e "  ${YELLOW}Expected:${NC} 9.x.x"
        ((failures++))
    fi

    # Check 4: Verify .nvm directory exists
    echo -e "${CYAN}•${NC} Checking .nvm directory..."
    if docker exec $container bash -c "[ -d /root/.nvm ] && echo 'exists'" | grep -q "exists"; then
        echo -e "  ${GREEN}✓${NC} .nvm directory exists"
    else
        echo -e "  ${RED}✗${NC} .nvm directory does not exist"
        ((failures++))
    fi

    # Check 5: Verify .bashrc has NVM configuration
    echo -e "${CYAN}•${NC} Checking .bashrc NVM configuration..."
    if docker exec $container bash -c "grep -q 'NVM_DIR' /root/.bashrc && echo 'configured'" | grep -q "configured"; then
        echo -e "  ${GREEN}✓${NC} .bashrc is properly configured for NVM"
    else
        echo -e "  ${RED}✗${NC} .bashrc is not configured for NVM"
        ((failures++))
    fi

    # Return the number of failures
    return $failures
}

# Run validation on app-1
APP1_FAILURES=0
validate_container "ansible-app-1"
APP1_FAILURES=$?
echo

# Run validation on app-2
APP2_FAILURES=0
validate_container "ansible-app-2"
APP2_FAILURES=$?
echo

# Calculate total failures
TOTAL_FAILURES=$((APP1_FAILURES + APP2_FAILURES))

# Check the result
if [ $TOTAL_FAILURES -eq 0 ]; then
    echo -e "${GREEN}[SUCCESS]${NC} ${BOLD}All validation checks passed!${NC}"
    FOOTER_COLOR=$MAGENTA
    FOOTER_TEXT="VALIDATION SUCCESSFUL"
else
    echo -e "${RED}[ERROR]${NC} ${BOLD}Validation failed with ${RED}$TOTAL_FAILURES${NC}${BOLD} errors!${NC}"
    FAILURE=1
    FOOTER_COLOR=$RED
    FOOTER_TEXT="VALIDATION FAILED"
fi

echo

# Print footer
echo -e "${FOOTER_COLOR}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${FOOTER_COLOR}║                ${CYAN}$FOOTER_TEXT${FOOTER_COLOR}                 ║${NC}"
echo -e "${FOOTER_COLOR}╚════════════════════════════════════════════════════════╝${NC}"

exit $FAILURE
