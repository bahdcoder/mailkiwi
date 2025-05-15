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
ANSIBLE_LOG_FILE="tests/logs/ansible-playbook-$(date +%Y-%m-%d-%H-%M-%S).log"

# Print header
echo -e "${BOLD}${MAGENTA}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${MAGENTA}║              ${CYAN}KIBAMAIL ANSIBLE TEST RUNNER${MAGENTA}              ║${NC}"
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

# Create a simple inventory file for app servers
echo -e "${BLUE}[TASK]${NC} ${BOLD}Creating inventory file for app servers...${NC}"
docker exec ansible-root bash -c "mkdir -p /root/ansible/tests/inventory"
docker exec ansible-root bash -c "echo '[app]' > /root/ansible/tests/inventory/app_hosts"
docker exec ansible-root bash -c "echo 'app-1' >> /root/ansible/tests/inventory/app_hosts"
docker exec ansible-root bash -c "echo 'app-2' >> /root/ansible/tests/inventory/app_hosts"
echo -e "${GREEN}[SUCCESS]${NC} ${BOLD}Inventory file created.${NC}"
echo

# Run the playbook
echo -e "${BLUE}[TASK]${NC} ${BOLD}Running Ansible playbook...${NC}"
echo -e "${CYAN}•${NC} Playbook: ${YELLOW}playbooks/app/setup.yml${NC}"
echo -e "${CYAN}•${NC} Hosts: ${YELLOW}app-1, app-2${NC}"
echo

# Function to stream output with real-time color formatting
stream_with_colors() {
    # Use stdbuf to disable buffering for real-time output
    # Use -t instead of -it to ensure it works in non-interactive environments
    docker exec -t ansible-root bash -c "cd /root/ansible && stdbuf -oL ansible-playbook -i tests/inventory/app_hosts playbooks/app/setup.yml -v" 2>&1 | tee -a "$ANSIBLE_LOG_FILE" | while IFS= read -r line; do
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

# If the command failed, try with a different path
if [ $EXIT_CODE -ne 0 ]; then
    echo -e "${YELLOW}[WARNING]${NC} ${BOLD}First attempt failed, trying with absolute path...${NC}"
    echo

    # Try with absolute path
    docker exec -t ansible-root bash -c "stdbuf -oL ansible-playbook -i /root/ansible/tests/inventory/app_hosts /root/ansible/playbooks/app/setup.yml -v" 2>&1 | tee -a "$ANSIBLE_LOG_FILE" | while IFS= read -r line; do
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

    EXIT_CODE=${PIPESTATUS[0]}
fi

# Set FAILURE flag based on exit code
if [ $EXIT_CODE -ne 0 ]; then
    FAILURE=1
fi

echo

# Check the result
if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}[SUCCESS]${NC} ${BOLD}Ansible playbook executed successfully!${NC}"
    FOOTER_COLOR=$MAGENTA
    FOOTER_TEXT="OPERATION COMPLETED"
else
    echo -e "${RED}[ERROR]${NC} ${BOLD}Ansible playbook execution failed!${NC}"
    FAILURE=1
    FOOTER_COLOR=$RED
    FOOTER_TEXT="OPERATION FAILED"
fi

echo

# Print footer
echo -e "${FOOTER_COLOR}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${FOOTER_COLOR}║                ${CYAN}$FOOTER_TEXT${FOOTER_COLOR}                     ║${NC}"
echo -e "${FOOTER_COLOR}╚════════════════════════════════════════════════════════╝${NC}"

exit $FAILURE
