#!/bin/bash

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${BOLD}${MAGENTA}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${MAGENTA}║                ${CYAN}ansible tests runner${MAGENTA}                  ║${NC}"
echo -e "${BOLD}${MAGENTA}╚════════════════════════════════════════════════════════╝${NC}"
echo

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ANSIBLE_DIR="$( cd "$SCRIPT_DIR/../../" && pwd )"

get_required_vms() {
    local test_name=$1
    case "$test_name" in
        "app") echo "ansible-root,app-1,app-2" ;;
        "mysql") echo "ansible-root,mysql-master,mysql-slave,app-1,app-2" ;;
        "mail") echo "ansible-root,mail-1,mail-2,mail-proxy" ;;
        "redis") echo "ansible-root,redis" ;;
        "backups") echo "ansible-root,mysql-master,mysql-slave" ;;
        "deploy") echo "ansible-root,app-1,app-2" ;;
        *) echo "" ;;
    esac
}

list_available_tests() {
    echo -e "${CYAN}•${NC} app ${YELLOW}(requires: $(get_required_vms "app"))${NC}"
    echo -e "${CYAN}•${NC} mysql ${YELLOW}(requires: $(get_required_vms "mysql"))${NC}"
    echo -e "${CYAN}•${NC} mail ${YELLOW}(requires: $(get_required_vms "mail"))${NC}"
    echo -e "${CYAN}•${NC} redis ${YELLOW}(requires: $(get_required_vms "redis"))${NC}"
}

if [ $# -lt 1 ]; then
    echo -e "${RED}[error]${NC} usage: $0 <test_name>"
    echo -e "${YELLOW}[info]${NC} available tests:"
    list_available_tests
    exit 1
fi

TEST_NAME=$1
TEST_DIR="$SCRIPT_DIR/$TEST_NAME"

if [ ! -d "$TEST_DIR" ]; then
    echo -e "${RED}[error]${NC} test directory for '$TEST_NAME' not found"
    echo -e "${YELLOW}[info]${NC} available tests:"
    list_available_tests
    exit 1
fi

REQUIRED_VMS=$(get_required_vms "$TEST_NAME")

if [ -z "$REQUIRED_VMS" ]; then
    echo -e "${RED}[error]${NC} test '$TEST_NAME' not found in test requirements"
    echo -e "${YELLOW}[info]${NC} available tests:"
    list_available_tests
    exit 1
fi

if [ ! -f "$TEST_DIR/run.sh" ]; then
    echo -e "${RED}[error]${NC} run.sh not found in test directory '$TEST_NAME'"
    exit 1
fi

chmod +x "$TEST_DIR/run.sh"

echo -e "${BLUE}[task]${NC} ensuring required vms are running: ${CYAN}$REQUIRED_VMS${NC}"

cd "$ANSIBLE_DIR"
./vagrant.sh --vms="$REQUIRED_VMS"

if [ $? -ne 0 ]; then
    echo -e "${RED}[error]${NC} failed to start required VMs"
    exit 1
fi

echo -e "${GREEN}[success]${NC} all required VMs are running"

echo -e "${BLUE}[task]${NC} running test: ${CYAN}$TEST_NAME${NC}..."
"$TEST_DIR/run.sh"
RUN_EXIT_CODE=$?

if [ -f "$TEST_DIR/verify.sh" ]; then
    chmod +x "$TEST_DIR/verify.sh"

    if [ $RUN_EXIT_CODE -eq 0 ]; then
        echo -e "${BLUE}[task]${NC} running verification for test: ${CYAN}$TEST_NAME${NC}..."
        "$TEST_DIR/verify.sh"
        VERIFY_EXIT_CODE=$?

        if [ $VERIFY_EXIT_CODE -ne 0 ]; then
            EXIT_CODE=$VERIFY_EXIT_CODE
        else
            EXIT_CODE=0
        fi
    else
        echo -e "${RED}[error]${NC} skipping verification due to test failure"
        EXIT_CODE=$RUN_EXIT_CODE
    fi
else
    EXIT_CODE=$RUN_EXIT_CODE
fi

if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}[success]${NC} test '$TEST_NAME' completed successfully!"
    FOOTER_COLOR=$MAGENTA
    FOOTER_TEXT="ansible tests completed"
else
    echo -e "${RED}[error]${NC} test '$TEST_NAME' failed!"
    FOOTER_COLOR=$RED
    FOOTER_TEXT="ansible tests failed"
fi

echo
echo -e "${FOOTER_COLOR}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${FOOTER_COLOR}║              ${CYAN}$FOOTER_TEXT${FOOTER_COLOR}                ${NC}"
echo -e "${FOOTER_COLOR}╚════════════════════════════════════════════════════════╝${NC}"

exit $EXIT_CODE
