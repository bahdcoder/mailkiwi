#!/bin/bash

# run.sh - script to test the app setup playbook in vagrant ansible-root vm

# Source the common test library
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
source "$SCRIPT_DIR/../common/test.sh"

# Print header
print_header "app setup playbook test"

# Run the playbook
run_playbook "playbooks/app/setup.yml" "app setup playbook"
exit $?
