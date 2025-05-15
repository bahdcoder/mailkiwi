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

# Set up logging for Ansible output
ANSIBLE_LOG_FILE="tests/logs/ansible-mysql-playbook-$(date +%Y-%m-%d-%H-%M-%S).log"

# Print header
echo -e "${BOLD}${MAGENTA}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${MAGENTA}║              ${CYAN}MYSQL PLAYBOOK TEST RUNNER${MAGENTA}               ║${NC}"
echo -e "${BOLD}${MAGENTA}╚════════════════════════════════════════════════════════╝${NC}"
echo
echo "Ansible log file: $ANSIBLE_LOG_FILE"
echo

# Check if ansible-root container is running
echo -e "${BLUE}[TASK]${NC} ${BOLD}Checking if ansible-root container is running...${NC}"
if ! docker ps | grep -q "ansible-root"; then
    echo -e "${RED}[ERROR]${NC} ${BOLD}ansible-root container is not running!${NC}"
    echo -e "${YELLOW}[INFO]${NC} ${BOLD}Please run setup-ssh-keys.sh first.${NC}"
    exit 1
fi

# Verify ansible is installed
echo -e "${BLUE}[TASK]${NC} ${BOLD}Verifying Ansible installation...${NC}"
if ! docker exec ansible-root which ansible-playbook > /dev/null 2>&1; then
    echo -e "${RED}[ERROR]${NC} ${BOLD}Ansible not found in container!${NC}"
    echo -e "${YELLOW}[INFO]${NC} ${BOLD}Please rebuild the Docker containers with the updated Dockerfile.${NC}"
    FAILURE=1
    exit $FAILURE
fi
echo -e "${GREEN}[SUCCESS]${NC} ${BOLD}Ansible is properly installed.${NC}"
echo

# Using staging inventory file
echo -e "${BLUE}[TASK]${NC} ${BOLD}Using staging inventory for MySQL servers...${NC}"
echo -e "${GREEN}[SUCCESS]${NC} ${BOLD}Using inventory file: inventory/staging/inventory.yaml${NC}"
echo

# Run the playbook
echo -e "${BLUE}[TASK]${NC} ${BOLD}Running MySQL Ansible playbook...${NC}"
echo -e "${CYAN}•${NC} Playbook: ${YELLOW}playbooks/mysql/setup.yml${NC}"
echo -e "${CYAN}•${NC} Hosts: ${YELLOW}mysql-master, mysql-slave${NC}"
echo

# Function to stream output with real-time color formatting
stream_with_colors() {
    # Use stdbuf to disable buffering for real-time output
    # Use -t instead of -it to ensure it works in non-interactive environments
    docker exec -t ansible-root bash -c "cd /root/ansible && stdbuf -oL ansible-playbook -i inventory/staging/inventory.yaml playbooks/mysql/setup.yml -v --limit mysql" 2>&1 | tee -a "$ANSIBLE_LOG_FILE" | while IFS= read -r line; do
        if [[ $line == *"TASK"* ]]; then
            echo -e "${BLUE}$line${NC}"
        elif [[ $line == *"ok:"* ]]; then
            echo -e "${GREEN}$line${NC}"
        elif [[ $line == *"changed:"* ]]; then
            echo -e "${YELLOW}$line${NC}"
        elif [[ $line == *"fatal:"* || $line == *"failed:"* ]]; then
            echo -e "${RED}$line${NC}"
        elif [[ $line == *"PLAY RECAP"* ]]; then
            echo -e "${MAGENTA}$line${NC}"
        elif [[ $line == *"failed="* && $line != *"failed=0"* ]]; then
            echo -e "${RED}$line${NC}"
        else
            echo "$line"
        fi
    done
}

# Execute the playbook with real-time output
echo -e "${CYAN}•${NC} Streaming playbook execution in real-time..."
echo

# Run the playbook and capture exit code
stream_with_colors
EXIT_CODE=${PIPESTATUS[0]}



# Set FAILURE flag based on exit code
if [ $EXIT_CODE -ne 0 ]; then
    FAILURE=1
fi

echo

# Check the result
if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}[SUCCESS]${NC} ${BOLD}MySQL Ansible playbook executed successfully!${NC}"
    FOOTER_COLOR=$MAGENTA
    FOOTER_TEXT="MYSQL PLAYBOOK COMPLETED"
else
    echo -e "${RED}[ERROR]${NC} ${BOLD}MySQL Ansible playbook execution failed!${NC}"
    FAILURE=1
    FOOTER_COLOR=$RED
    FOOTER_TEXT="MYSQL PLAYBOOK FAILED"
fi

echo

# Print footer
echo -e "${FOOTER_COLOR}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${FOOTER_COLOR}║              ${CYAN}$FOOTER_TEXT${FOOTER_COLOR}               ║${NC}"
echo -e "${FOOTER_COLOR}╚════════════════════════════════════════════════════════╝${NC}"

exit $FAILURE
