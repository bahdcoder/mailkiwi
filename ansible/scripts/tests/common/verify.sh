#!/bin/bash

# verify.sh - common functions for ansible verification scripts

# Source the test library for color codes and common functions
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
source "$SCRIPT_DIR/test.sh"

# Host to IP address mappings from inventory
APP_1_IP="172.16.0.3"
APP_2_IP="172.16.0.2"
DRAGONFLY_IP="172.16.0.11"
MAIL_1_IP="172.16.0.10"
MAIL_2_IP="172.16.0.5"
MAIL_PROXY_IP="172.16.0.6"
MYSQL_MASTER_IP="172.16.0.9"
MYSQL_SLAVE_IP="172.16.0.8"
MONITORING_IP="172.16.0.4"
ANSIBLE_ROOT_IP="172.16.0.100"

# Function to run a test and report result
run_test() {
    local test_name="$1"
    local test_command="$2"
    local host="$3"
    local timeout="${4:-15}"

    echo -e "${BLUE}[test]${NC} $test_name on $host..."

    # Run the test command with a timeout
    vagrant ssh $host -c "timeout $timeout $test_command"
    local exit_code=$?

    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}[✓] Test passed:${NC} $test_name"
        return 0
    else
        echo -e "${RED}[✗] Test failed:${NC} $test_name"
        return 1
    fi
}

# Function to run a command test with fallback
run_command_test() {
    local test_name="$1"
    local primary_command="$2"
    local fallback_command="$3"
    local host="$4"
    local timeout="${5:-15}"

    echo -e "${BLUE}[test]${NC} $test_name on $host..."

    # Try the primary command first
    vagrant ssh $host -c "timeout $timeout $primary_command" 2>/dev/null
    local exit_code=$?

    # If primary command fails, try the fallback
    if [ $exit_code -ne 0 ] && [ -n "$fallback_command" ]; then
        echo -e "${YELLOW}[warning]${NC} primary command failed, trying fallback..."
        vagrant ssh $host -c "timeout $timeout $fallback_command" 2>/dev/null
        exit_code=$?
    fi

    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}[✓] Test passed:${NC} $test_name"
        return 0
    else
        echo -e "${RED}[✗] Test failed:${NC} $test_name"
        return 1
    fi
}

# Function to print test summary
print_test_summary() {
    local test_failures="$1"
    local test_type="$2"

    if [ $test_failures -eq 0 ]; then
        echo -e "${GREEN}[success]${NC} all $test_type verification tests passed!"
        print_footer "$test_type verification completed successfully" "$MAGENTA"
        return 0
    else
        echo -e "${RED}[error]${NC} $test_failures $test_type verification tests failed!"
        print_footer "$test_type verification failed" "$RED"
        return 1
    fi
}
