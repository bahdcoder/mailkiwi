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
LOG_FILE="tests/logs/ansible-tests-$(date +%Y-%m-%d-%H-%M-%S).log"
exec > >(tee -a "$LOG_FILE") 2>&1

echo "Starting Ansible tests at $(date)"
echo "Log file: $LOG_FILE"
echo

# Function to run cleanup
cleanup() {
    echo
    echo -e "${BLUE}[TASK]${NC} ${BOLD}Running cleanup...${NC}"
    ./tests/scripts/cleanup-tests.sh
}

# We'll call cleanup manually at the end instead of using trap
# This ensures validation can run before containers are removed

# Print header
echo -e "${BOLD}${MAGENTA}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${MAGENTA}║                ${CYAN}KIBAMAIL ANSIBLE TEST RUNNER${MAGENTA}                   ║${NC}"
echo -e "${BOLD}${MAGENTA}╚════════════════════════════════════════════════════════╝${NC}"
echo

# Step 1: Check for existing containers
echo -e "${BLUE}[STEP 1]${NC} ${BOLD}Checking for existing containers...${NC}"
if docker ps | grep -q "ansible-app-1" && docker ps | grep -q "ansible-app-2"; then
    echo -e "${YELLOW}[INFO]${NC} ${BOLD}Existing containers found. Skipping container setup.${NC}"
    CONTAINERS_EXIST=true
else
    echo -e "${CYAN}[INFO]${NC} ${BOLD}No existing containers found. Will set up new containers.${NC}"
    CONTAINERS_EXIST=false
    # Clean up any partial setup
    ./tests/scripts/cleanup-tests.sh
fi
echo

# Step 2: Generate SSH keys
echo -e "${BLUE}[STEP 2]${NC} ${BOLD}Generating SSH keys...${NC}"
if ! ./tests/scripts/generate-ssh-key.sh; then
    echo -e "${RED}[ERROR]${NC} ${BOLD}Failed to generate SSH keys!${NC}"
    FAILURE=1
    exit $FAILURE
fi
echo

# Step 3: Setup SSH keys and containers (if needed)
echo -e "${BLUE}[STEP 3]${NC} ${BOLD}Setting up SSH keys and containers...${NC}"
if [ "$CONTAINERS_EXIST" = false ]; then
    if ! ./tests/scripts/setup-ssh-keys.sh; then
        echo -e "${RED}[ERROR]${NC} ${BOLD}Failed to setup SSH keys!${NC}"
        FAILURE=1
        exit $FAILURE
    fi
else
    echo -e "${YELLOW}[INFO]${NC} ${BOLD}Using existing containers. Skipping SSH setup.${NC}"
fi
echo

# Step 4: Run Ansible playbook
echo -e "${BLUE}[STEP 4]${NC} ${BOLD}Running Ansible playbook...${NC}"
if ! ./tests/scripts/run-ansible-playbook.sh; then
    echo -e "${RED}[ERROR]${NC} ${BOLD}Ansible playbook execution failed!${NC}"
    FAILURE=1
    exit $FAILURE
fi
echo

# Step 5: Validate Ansible setup
echo -e "${BLUE}[STEP 5]${NC} ${BOLD}Validating Ansible setup...${NC}"
if ! ./tests/scripts/validate-ansible-setup.sh; then
    echo -e "${RED}[ERROR]${NC} ${BOLD}Ansible setup validation failed!${NC}"
    FAILURE=1
    exit $FAILURE
fi
echo

# Final status
if [ $FAILURE -eq 0 ]; then
    echo -e "${GREEN}[SUCCESS]${NC} ${BOLD}All tests completed successfully!${NC}"
    FOOTER_COLOR=$MAGENTA
    FOOTER_TEXT="ALL TESTS PASSED"
else
    echo -e "${RED}[ERROR]${NC} ${BOLD}Tests failed!${NC}"
    FOOTER_COLOR=$RED
    FOOTER_TEXT="TESTS FAILED"
fi

echo

# Print footer
echo -e "${FOOTER_COLOR}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${FOOTER_COLOR}║                ${CYAN}$FOOTER_TEXT${FOOTER_COLOR}                       ║${NC}"
echo -e "${FOOTER_COLOR}╚════════════════════════════════════════════════════════╝${NC}"

# Run cleanup manually
cleanup

exit $FAILURE
