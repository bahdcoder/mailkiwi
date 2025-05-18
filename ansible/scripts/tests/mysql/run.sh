#!/bin/bash

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
source "$SCRIPT_DIR/../common/test.sh"

print_header "mysql setup playbook test"

source_vault_secrets

run_playbook "playbooks/mysql/setup.yml" "mysql setup playbook"

run_playbook "playbooks/mysql/setup.yml" "mysql setup playbook"

if [ $? -eq 0 ] && [ -f "$SCRIPT_DIR/verify.sh" ]; then
    run_verification "$SCRIPT_DIR/verify.sh" "mysql setup"
    exit $?
else
    exit $?
fi
