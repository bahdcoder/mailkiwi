#!/bin/bash

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
source "$SCRIPT_DIR/../common/test.sh"

print_header "mysql backup playbook test"

source_vault_secrets

echo -e "${BLUE}[task]${NC} running mysql setup playbook first..."
run_playbook "playbooks/mysql/setup.yml" "mysql setup playbook"

if [ $? -ne 0 ]; then
    echo -e "${RED}[error]${NC} mysql setup playbook failed, cannot proceed with backup test"
    exit 1
fi

echo -e "${BLUE}[task]${NC} running mysql backup playbook..."
run_playbook "playbooks/mysql/backup.yml" "mysql backup playbook"

if [ $? -eq 0 ] && [ -f "$SCRIPT_DIR/verify.sh" ]; then
    run_verification "$SCRIPT_DIR/verify.sh" "mysql backup"
    exit $?
else
    exit $?
fi
