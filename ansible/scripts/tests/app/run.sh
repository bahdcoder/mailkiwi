#!/bin/bash

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
source "$SCRIPT_DIR/../common/test.sh"

print_header "app setup playbook test"

source_vault_secrets

run_playbook "playbooks/app/setup.yml" "app setup playbook"
exit $?
