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

# We'll call cleanup manually at the beginning and end

# Print header
echo -e "${BOLD}${MAGENTA}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${MAGENTA}║                ${CYAN}KIBAMAIL ANSIBLE TEST RUNNER${MAGENTA}                   ║${NC}"
echo -e "${BOLD}${MAGENTA}╚════════════════════════════════════════════════════════╝${NC}"
echo

# Step 1: Always run cleanup first to ensure a clean environment
echo -e "${BLUE}[STEP 1]${NC} ${BOLD}Cleaning up any existing containers...${NC}"
./tests/scripts/cleanup-tests.sh
echo

# Step 1.5: Check if vault_secrets.txt exists, if not run setup-infisical.sh
echo -e "${BLUE}[STEP 1.5]${NC} ${BOLD}Checking for vault_secrets.txt...${NC}"
if [ ! -f "vault_secrets.txt" ]; then
    echo -e "${YELLOW}[WARNING]${NC} ${BOLD}vault_secrets.txt not found. Running setup-infisical.sh...${NC}"

    # Check if ANSIBLE_INFISICAL_TOKEN is set
    if [ -z "$ANSIBLE_INFISICAL_TOKEN" ]; then
        echo -e "${RED}[ERROR]${NC} ${BOLD}ANSIBLE_INFISICAL_TOKEN environment variable not set.${NC}"
        echo -e "${YELLOW}[INFO]${NC} ${BOLD}Please set ANSIBLE_INFISICAL_TOKEN environment variable or run ./scripts/setup-infisical.sh manually.${NC}"
        FAILURE=1
        exit $FAILURE
    fi

    # Run setup-infisical.sh with staging environment by default
    if ! ./scripts/setup-infisical.sh staging; then
        echo -e "${RED}[ERROR]${NC} ${BOLD}Failed to set up Infisical secrets!${NC}"
        FAILURE=1
        exit $FAILURE
    fi
    echo -e "${GREEN}[SUCCESS]${NC} ${BOLD}vault_secrets.txt created successfully.${NC}"
else
    echo -e "${GREEN}[SUCCESS]${NC} ${BOLD}vault_secrets.txt already exists.${NC}"
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

# Step 3: Setup SSH keys and containers
echo -e "${BLUE}[STEP 3]${NC} ${BOLD}Setting up SSH keys and containers...${NC}"
if ! ./tests/scripts/setup-ssh-keys.sh; then
    echo -e "${RED}[ERROR]${NC} ${BOLD}Failed to setup SSH keys!${NC}"
    FAILURE=1
    exit $FAILURE
fi
echo

# Step 4: Run Ansible playbooks
echo -e "${BLUE}[STEP 4]${NC} ${BOLD}Running Ansible playbooks...${NC}"

# Step 4.1: Run App playbook
echo -e "${BLUE}[STEP 4.1]${NC} ${BOLD}Running App playbook...${NC}"
if ! ./tests/scripts/playbooks/app/setup.sh; then
    echo -e "${RED}[ERROR]${NC} ${BOLD}App playbook execution failed!${NC}"
    FAILURE=1
    exit $FAILURE
fi
echo -e "${GREEN}[SUCCESS]${NC} ${BOLD}App playbook executed successfully.${NC}"
echo

# Step 4.2: Run MySQL playbook
echo -e "${BLUE}[STEP 4.2]${NC} ${BOLD}Running MySQL playbook...${NC}"
if ! ./tests/scripts/playbooks/mysql/setup.sh; then
    echo -e "${RED}[ERROR]${NC} ${BOLD}MySQL playbook execution failed!${NC}"
    FAILURE=1
    exit $FAILURE
fi
echo -e "${GREEN}[SUCCESS]${NC} ${BOLD}MySQL playbook executed successfully.${NC}"
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

# Run cleanup manually at the end
echo -e "${BLUE}[STEP 6]${NC} ${BOLD}Final cleanup...${NC}"
cleanup

exit $FAILURE
