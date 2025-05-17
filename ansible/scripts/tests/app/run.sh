#!/bin/bash

# run.sh - script to test the app setup playbook in vagrant ansible-root vm

# define color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m' # no color

# print header
echo -e "${BOLD}${MAGENTA}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${MAGENTA}║              ${CYAN}app setup playbook test${MAGENTA}                ║${NC}"
echo -e "${BOLD}${MAGENTA}╚════════════════════════════════════════════════════════╝${NC}"
echo

# set script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ANSIBLE_DIR="$( cd "$SCRIPT_DIR/../../../" && pwd )"

# VMs are already checked and started by the main run.sh script
cd "$ANSIBLE_DIR"

# run the playbook in ansible-root vm
echo -e "${BLUE}[task]${NC} running app setup playbook in ansible-root vm..."

# ssh into ansible-root and run the playbook
vagrant ssh ansible-root -c "cd /ansible && sudo -u ansible ansible-playbook -i inventory/staging/inventory.yaml playbooks/app/setup.yml -v"

PLAYBOOK_EXIT_CODE=$?

if [ $PLAYBOOK_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}[success]${NC} app setup playbook executed successfully!"
    FOOTER_COLOR=$MAGENTA
    FOOTER_TEXT="app setup playbook test completed"
else
    echo -e "${RED}[error]${NC} app setup playbook execution failed!"
    FOOTER_COLOR=$RED
    FOOTER_TEXT="app setup playbook test failed"
    exit 1
fi

echo
echo -e "${FOOTER_COLOR}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${FOOTER_COLOR}║              ${CYAN}$FOOTER_TEXT${FOOTER_COLOR}                ${NC}"
echo -e "${FOOTER_COLOR}╚════════════════════════════════════════════════════════╝${NC}"

exit 0
