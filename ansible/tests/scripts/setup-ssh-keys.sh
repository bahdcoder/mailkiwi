#!/bin/bash

set -eo pipefail

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

# Print header
echo -e "${BOLD}${MAGENTA}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${MAGENTA}║                ${CYAN}KIBAMAIL SSH SETUP UTILITY${MAGENTA}               ║${NC}"
echo -e "${BOLD}${MAGENTA}╚════════════════════════════════════════════════════════╝${NC}"
echo

# Check for SSH key
if [ ! -f tests/.ssh/kibamail-test ]; then
    echo -e "${RED}[ERROR]${NC} ${BOLD}SSH key not found!${NC}"
    echo -e "${YELLOW}[INFO]${NC} Please run ${CYAN}generate-ssh-key.sh${NC} first."
    exit 1
fi

# Check for Docker containers
if ! docker ps | grep -q "ansible-root"; then
    echo -e "${YELLOW}[INFO]${NC} ${BOLD}Containers not running.${NC}"
    echo -e "${BLUE}[TASK]${NC} ${BOLD}Starting Docker Compose...${NC}"

    if ! docker-compose -f tests/docker/docker-compose.yml up -d --wait; then
        echo -e "${RED}[ERROR]${NC} ${BOLD}Failed to start Docker containers!${NC}"
        FAILURE=1
        echo
        exit $FAILURE
    fi

    # Verify all containers are running
    for CONTAINER in ansible-root ansible-app-1 ansible-app-2 ansible-dragonfly ansible-mail-1 ansible-mail-2 ansible-mail-proxy ansible-mysql-master ansible-mysql-slave ansible-monitoring; do
        if ! docker ps --format '{{.Names}}' | grep -q "^$CONTAINER$"; then
            echo -e "${RED}[ERROR]${NC} ${BOLD}Container $CONTAINER failed to start!${NC}"
            FAILURE=1
            echo
            exit $FAILURE
        fi
    done

    echo -e "${GREEN}[SUCCESS]${NC} ${BOLD}Containers started successfully!${NC}"
    echo
fi

# Get public key
echo -e "${BLUE}[TASK]${NC} ${BOLD}Reading SSH public key...${NC}"
if [ ! -f tests/.ssh/kibamail-test.pub ]; then
    echo -e "${RED}[ERROR]${NC} ${BOLD}Public key file not found!${NC}"
    FAILURE=1
    echo
    exit $FAILURE
fi

PUB_KEY=$(cat tests/.ssh/kibamail-test.pub 2>/dev/null)
if [ -z "$PUB_KEY" ]; then
    echo -e "${RED}[ERROR]${NC} ${BOLD}Failed to read public key or key is empty!${NC}"
    FAILURE=1
    echo
    exit $FAILURE
fi

echo -e "${GREEN}[SUCCESS]${NC} ${BOLD}Public key loaded.${NC}"
echo

# Setup root container
echo -e "${BLUE}[TASK]${NC} ${BOLD}Setting up ansible-root container...${NC}"

# Check if root container is running
if ! docker ps --format '{{.Names}}' | grep -q "^ansible-root$"; then
    echo -e "  ${RED}✗${NC} ${BOLD}ansible-root container is not running!${NC}"
    FAILURE=1
    echo
    exit $FAILURE
fi

# Create .ssh directory
if ! docker exec ansible-root mkdir -p /root/.ssh 2>/dev/null; then
    echo -e "  ${RED}✗${NC} ${BOLD}Failed to create .ssh directory in ansible-root${NC}"
    FAILURE=1
    echo
    exit $FAILURE
fi
echo -e "  ${CYAN}•${NC} Created .ssh directory"

# Copy SSH private key
if ! docker cp tests/.ssh/kibamail-test ansible-root:/root/.ssh/id_ed25519 2>/dev/null; then
    echo -e "  ${RED}✗${NC} ${BOLD}Failed to copy SSH private key to ansible-root${NC}"
    FAILURE=1
    echo
    exit $FAILURE
fi

if ! docker exec ansible-root chmod 600 /root/.ssh/id_ed25519 2>/dev/null; then
    echo -e "  ${RED}✗${NC} ${BOLD}Failed to set permissions on SSH private key${NC}"
    FAILURE=1
    echo
    exit $FAILURE
fi
echo -e "  ${CYAN}•${NC} Copied SSH private key"

# Create SSH config
if ! docker exec ansible-root bash -c 'echo -e "Host *\n  IdentityFile ~/.ssh/id_ed25519\n  StrictHostKeyChecking no" > /root/.ssh/config' 2>/dev/null; then
    echo -e "  ${RED}✗${NC} ${BOLD}Failed to create SSH config in ansible-root${NC}"
    FAILURE=1
    echo
    exit $FAILURE
fi

if ! docker exec ansible-root chmod 600 /root/.ssh/config 2>/dev/null; then
    echo -e "  ${RED}✗${NC} ${BOLD}Failed to set permissions on SSH config${NC}"
    FAILURE=1
    echo
    exit $FAILURE
fi
echo -e "  ${CYAN}•${NC} Created SSH config"
echo -e "${GREEN}[SUCCESS]${NC} ${BOLD}Root container setup complete.${NC}"
echo

# Define containers
CONTAINERS=("ansible-app-1" "ansible-app-2" "ansible-dragonfly" "ansible-mail-1" "ansible-mail-2" "ansible-mail-proxy" "ansible-mysql-master" "ansible-mysql-slave" "ansible-monitoring")

# Setup SSH keys for each container
echo -e "${BLUE}[TASK]${NC} ${BOLD}Setting up SSH keys for all containers...${NC}"
echo

for CONTAINER in "${CONTAINERS[@]}"; do
    echo -e "${CYAN}[CONTAINER]${NC} ${BOLD}Setting up ${YELLOW}$CONTAINER${NC}${BOLD}...${NC}"

    # Check if container is running
    if ! docker ps --format '{{.Names}}' | grep -q "^$CONTAINER$"; then
        echo -e "  ${RED}✗${NC} ${BOLD}Container $CONTAINER is not running!${NC}"
        FAILURE=1
        continue
    fi

    # Create .ssh directory
    if ! docker exec $CONTAINER mkdir -p /root/.ssh 2>/dev/null; then
        echo -e "  ${RED}✗${NC} ${BOLD}Failed to create .ssh directory in $CONTAINER${NC}"
        FAILURE=1
        continue
    fi
    echo -e "  ${CYAN}•${NC} Created .ssh directory"

    # Add public key
    if ! docker exec $CONTAINER bash -c "echo '$PUB_KEY' >> /root/.ssh/authorized_keys" 2>/dev/null; then
        echo -e "  ${RED}✗${NC} ${BOLD}Failed to add public key to $CONTAINER${NC}"
        FAILURE=1
        continue
    fi
    echo -e "  ${CYAN}•${NC} Added public key to authorized_keys"

    # Set permissions
    if ! docker exec $CONTAINER chmod 700 /root/.ssh 2>/dev/null || \
       ! docker exec $CONTAINER chmod 600 /root/.ssh/authorized_keys 2>/dev/null; then
        echo -e "  ${RED}✗${NC} ${BOLD}Failed to set permissions in $CONTAINER${NC}"
        FAILURE=1
        continue
    fi
    echo -e "  ${CYAN}•${NC} Set correct permissions"

    # Add host key
    if ! docker exec ansible-root bash -c "ssh-keyscan -H $CONTAINER >> /root/.ssh/known_hosts 2>/dev/null"; then
        echo -e "  ${RED}✗${NC} ${BOLD}Failed to add host key for $CONTAINER${NC}"
        FAILURE=1
        continue
    fi
    echo -e "  ${CYAN}•${NC} Added host key to known_hosts"

    echo -e "  ${GREEN}✓${NC} ${BOLD}SSH key setup completed for $CONTAINER${NC}"
    echo
done

# Setup hosts file
echo -e "${BLUE}[TASK]${NC} ${BOLD}Setting up hosts file in root container...${NC}"

# Define host entries
HOSTS=(
    "172.16.0.3 app-1"
    "172.16.0.2 app-2"
    "172.16.0.11 dragonfly"
    "172.16.0.10 mail-1"
    "172.16.0.5 mail-2"
    "172.16.0.6 mail-proxy"
    "172.16.0.9 mysql-master"
    "172.16.0.8 mysql-slave"
    "172.16.0.4 monitoring"
)

# Add hosts to /etc/hosts
for HOST in "${HOSTS[@]}"; do
    if ! docker exec ansible-root bash -c "echo '$HOST' >> /etc/hosts" 2>/dev/null; then
        echo -e "  ${RED}✗${NC} ${BOLD}Failed to add host entry: $HOST${NC}"
        FAILURE=1
    else
        echo -e "  ${CYAN}•${NC} Added host entry: $HOST"
    fi
done

if [ $FAILURE -eq 0 ]; then
    echo -e "${GREEN}[SUCCESS]${NC} ${BOLD}Hosts file updated.${NC}"
else
    echo -e "${RED}[WARNING]${NC} ${BOLD}Some host entries could not be added.${NC}"
fi
echo

# Test SSH connections
echo -e "${BLUE}[TASK]${NC} ${BOLD}Testing SSH connections from root container...${NC}"
echo

CONNECTION_FAILURES=0
for CONTAINER in "${CONTAINERS[@]}"; do
    echo -e "  ${CYAN}•${NC} Testing connection to ${YELLOW}$CONTAINER${NC}..."
    RESULT=$(docker exec ansible-root ssh -o ConnectTimeout=5 root@$CONTAINER "echo 'SUCCESS'" 2>/dev/null || echo "FAILED")

    if [ "$RESULT" == "SUCCESS" ]; then
        echo -e "    ${GREEN}✓${NC} ${BOLD}Connection successful!${NC}"
    else
        echo -e "    ${RED}✗${NC} ${BOLD}Connection failed!${NC}"
        CONNECTION_FAILURES=$((CONNECTION_FAILURES + 1))
        FAILURE=1
    fi
done

echo

# Final status
if [ $FAILURE -eq 0 ]; then
    echo -e "${GREEN}[SUCCESS]${NC} ${BOLD}SSH setup completed successfully!${NC}"
    FOOTER_COLOR=$MAGENTA
    FOOTER_TEXT="OPERATION COMPLETED"
else
    echo -e "${RED}[ERROR]${NC} ${BOLD}SSH setup completed with errors!${NC}"
    if [ $CONNECTION_FAILURES -gt 0 ]; then
        echo -e "${RED}[ERROR]${NC} ${BOLD}$CONNECTION_FAILURES SSH connection(s) failed.${NC}"
    fi
    FOOTER_COLOR=$RED
    FOOTER_TEXT="OPERATION FAILED"
fi
echo

# Print footer
echo -e "${FOOTER_COLOR}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${FOOTER_COLOR}║                ${CYAN}$FOOTER_TEXT${FOOTER_COLOR}                     ║${NC}"
echo -e "${FOOTER_COLOR}╚════════════════════════════════════════════════════════╝${NC}"

# Exit with appropriate status code
exit $FAILURE
