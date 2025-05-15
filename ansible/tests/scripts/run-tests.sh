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

# Function to run cleanup regardless of test outcome
cleanup() {
    echo
    echo -e "${BLUE}[TASK]${NC} ${BOLD}Running cleanup...${NC}"
    ./tests/scripts/cleanup-tests.sh
}

# Register the cleanup function to run on script exit
trap cleanup EXIT

# Print header
echo -e "${BOLD}${MAGENTA}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${MAGENTA}║                ${CYAN}KIBAMAIL ANSIBLE TEST RUNNER${MAGENTA}                   ║${NC}"
echo -e "${BOLD}${MAGENTA}╚════════════════════════════════════════════════════════╝${NC}"
echo

# Step 1: Initial cleanup
echo -e "${BLUE}[STEP 1]${NC} ${BOLD}Running initial cleanup...${NC}"
./tests/scripts/cleanup-tests.sh
echo

# Step 2: Generate SSH keys
echo -e "${BLUE}[STEP 2]${NC} ${BOLD}Generating SSH keys...${NC}"
if ! ./tests/scripts/generate-ssh-key.sh; then
    echo -e "${RED}[ERROR]${NC} ${BOLD}Failed to generate SSH keys!${NC}"
    FAILURE=1
    exit $FAILURE
fi
echo

# Step 3: Setup SSH keys and containers
echo -e "${BLUE}[STEP 3]${NC} ${BOLD}Setting up SSH keys and containers...${NC}"
if ! ./tests/scripts/setup-ssh-keys.sh; then
    echo -e "${RED}[ERROR]${NC} ${BOLD}Failed to setup SSH keys!${NC}"
    FAILURE=1
    exit $FAILURE
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

exit $FAILURE
