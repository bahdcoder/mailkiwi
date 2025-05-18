#!/bin/bash

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
source "$SCRIPT_DIR/../common/verify.sh"

source_vault_secrets

print_header "app setup verification"
echo -e "${BLUE}[task]${NC} verifying app setup..."

TEST_FAILURES=0

# Node.js installation tests for app-1
run_test "node binary exists in /usr/bin" "test -f /usr/bin/node" "app-1"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "npm binary exists in /usr/bin" "test -f /usr/bin/npm" "app-1"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "npx binary exists in /usr/bin" "test -f /usr/bin/npx" "app-1"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "nodesource repository is configured" "test -f /etc/apt/sources.list.d/nodesource.list" "app-1"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "node.js v22.15.1 is installed globally" "node --version | grep -q 'v22.15.1'" "app-1"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "npm v10.x is installed globally" "npm --version | grep -q '^10'" "app-1"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "pnpm is installed and in PATH" "which pnpm >/dev/null 2>&1" "app-1"
TEST_FAILURES=$((TEST_FAILURES + $?))

# Node.js installation tests for app-2
run_test "node binary exists in /usr/bin" "test -f /usr/bin/node" "app-2"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "npm binary exists in /usr/bin" "test -f /usr/bin/npm" "app-2"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "npx binary exists in /usr/bin" "test -f /usr/bin/npx" "app-2"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "nodesource repository is configured" "test -f /etc/apt/sources.list.d/nodesource.list" "app-2"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "node.js v22.15.1 is installed globally" "node --version | grep -q 'v22.15.1'" "app-2"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "npm v10.x is installed globally" "npm --version | grep -q '^10'" "app-2"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "pnpm is installed and in PATH" "which pnpm >/dev/null 2>&1" "app-2"
TEST_FAILURES=$((TEST_FAILURES + $?))

print_test_summary $TEST_FAILURES "app"
exit $?
