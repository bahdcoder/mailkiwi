#!/bin/bash

# verify.sh - script to verify app setup playbook implementation in vagrant vms

# define color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m' # no color

# define check mark and x mark
CHECK_MARK="\xE2\x9C\x94"
X_MARK="\xE2\x9C\x96"

# print header
echo -e "${BOLD}${MAGENTA}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${MAGENTA}║            ${CYAN}app setup playbook verification${MAGENTA}            ║${NC}"
echo -e "${BOLD}${MAGENTA}╚════════════════════════════════════════════════════════╝${NC}"
echo

# set script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ANSIBLE_DIR="$( cd "$SCRIPT_DIR/../../../" && pwd )"

# VMs are already checked and started by the main run.sh script
cd "$ANSIBLE_DIR"

# initialize verification results
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

# No VM reachability check - we'll directly run commands

# function to run verification on a vm
verify_vm() {
    local vm=$1
    echo -e "${BLUE}[task]${NC} verifying ${CYAN}$vm${NC}..."

    # array of verification commands and descriptions
    declare -a verifications=(
        "test -f /usr/bin/node|node binary exists in /usr/bin"
        "test -f /usr/bin/npm|npm binary exists in /usr/bin"
        "test -f /usr/bin/npx|npx binary exists in /usr/bin"
        "test -f /etc/apt/sources.list.d/nodesource.list|nodesource repository is configured"
        "node --version | grep -q 'v22.15.1'|node.js v22.15.1 is installed globally"
        "npm --version | grep -q '^10'|npm v10.x is installed globally"
        "which pnpm >/dev/null 2>&1|pnpm is installed and in PATH"
        "dpkg -l nodejs | grep -q '^ii'|nodejs is installed via apt"
    )

    echo -e "${YELLOW}[info]${NC} running ${#verifications[@]} verification checks..."
    echo

    # print verification table header
    echo -e "${BOLD}┌────────────────────────────────────────────────────────┐${NC}"
    echo -e "${BOLD}│ ${CYAN}Verification Check                                Status ${NC}│${NC}"
    echo -e "${BOLD}├────────────────────────────────────────────────────────┤${NC}"

    # run each verification
    for verification in "${verifications[@]}"; do
        IFS='|' read -r command description <<< "$verification"

        # log the command being run
        echo -e "${YELLOW}[command]${NC} running: ${CYAN}$command${NC} on ${CYAN}$vm${NC}"

        # run the command on the vm with a timeout inside the VM
        timeout_seconds=5
        vagrant ssh $vm -c "timeout $timeout_seconds $command" > /dev/null 2>&1
        result=$?

        # if the command timed out (exit code 124 from timeout) or other error, mark as failed
        if [ $result -ne 0 ]; then
            if [ $result -eq 124 ]; then
                echo -e "${YELLOW}[warning]${NC} command timed out after ${timeout_seconds} seconds: $command"
            else
                echo -e "${YELLOW}[warning]${NC} command failed with exit code ${result}: $command"

                # If this is the pnpm check that failed, let's see what version is actually installed
                if [[ "$command" == *"pnpm"* && "$command" == *"version"* ]]; then
                    echo -e "${YELLOW}[debug]${NC} checking actual pnpm version..."
                    vagrant ssh $vm -c "command -v pnpm && pnpm --version || echo 'pnpm not found'" 2>/dev/null
                fi
            fi
            result=1
        fi

        TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

        # print the result with checkmark or cross
        if [ $result -eq 0 ]; then
            echo -e "${BOLD}│ ${NC}${description}${NC}$(printf '%*s' $((48 - ${#description})) "") ${GREEN}${CHECK_MARK} PASS${NC} │${NC}"
            echo -e "${GREEN}[✓]${NC} ${BOLD}Test passed:${NC} ${description}"
            PASSED_CHECKS=$((PASSED_CHECKS + 1))
        else
            echo -e "${BOLD}│ ${NC}${description}${NC}$(printf '%*s' $((48 - ${#description})) "") ${RED}${X_MARK} FAIL${NC} │${NC}"
            echo -e "${RED}[✗]${NC} ${BOLD}Test failed:${NC} ${description}"
            FAILED_CHECKS=$((FAILED_CHECKS + 1))
        fi
    done

    # print verification table footer
    echo -e "${BOLD}└────────────────────────────────────────────────────────┘${NC}"
    echo
}

# verify app-1 and app-2
for vm in "app-1" "app-2"; do
    echo -e "${BLUE}[task]${NC} verifying ${CYAN}$vm${NC}..."
    verify_vm "$vm"
done

# print summary
echo -e "${BLUE}[summary]${NC} verification results:"
echo -e "${CYAN}•${NC} total checks: ${BOLD}$TOTAL_CHECKS${NC}"
echo -e "${GREEN}•${NC} passed: ${GREEN}${BOLD}$PASSED_CHECKS${NC} ${GREEN}${CHECK_MARK}${NC}"
echo -e "${RED}•${NC} failed: ${RED}${BOLD}$FAILED_CHECKS${NC} ${RED}${X_MARK}${NC}"
echo

# calculate pass percentage
if [ $TOTAL_CHECKS -gt 0 ]; then
    PASS_PERCENTAGE=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))
    echo -e "${CYAN}•${NC} pass rate: ${BOLD}${PASS_PERCENTAGE}%${NC}"
    echo
fi

# determine overall status
if [ $FAILED_CHECKS -eq 0 ]; then
    echo -e "${GREEN}[✓]${NC} ${BOLD}SUCCESS:${NC} all verification checks passed!"
    FOOTER_COLOR=$MAGENTA
    FOOTER_TEXT="app setup verification completed"
    EXIT_CODE=0
else
    echo -e "${RED}[✗]${NC} ${BOLD}FAILURE:${NC} $FAILED_CHECKS verification check(s) failed!"
    FOOTER_COLOR=$RED
    FOOTER_TEXT="app setup verification failed"
    EXIT_CODE=1
fi

echo
echo -e "${FOOTER_COLOR}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${FOOTER_COLOR}║              ${CYAN}$FOOTER_TEXT${FOOTER_COLOR}                ${NC}"
echo -e "${FOOTER_COLOR}╚════════════════════════════════════════════════════════╝${NC}"

exit $EXIT_CODE
