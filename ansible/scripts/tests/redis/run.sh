#!/bin/bash

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
source "$SCRIPT_DIR/../common/test.sh"

print_header "redis setup playbook test"

source_vault_secrets

run_playbook "playbooks/redis/setup.yml" "redis setup playbook"

if [ $? -eq 0 ] && [ -f "$SCRIPT_DIR/verify.sh" ]; then
    run_verification "$SCRIPT_DIR/verify.sh" "redis setup"
    exit $?
else
    exit $?
fi
