#!/bin/bash

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
source "$SCRIPT_DIR/../common/verify.sh"

source_vault_secrets

print_header "deploy verification"
echo -e "${BLUE}[task]${NC} verifying deployment..."

TEST_TAG="${TEST_TAG:-test-tag}"
echo -e "${BLUE}[info]${NC} verifying deployment for tag: $TEST_TAG"

TEST_FAILURES=0

DEPLOYMENT_DIR="/var/www/kibamail/deployments/deployment-$TEST_TAG"
CURRENT_SYMLINK="/var/www/kibamail/current"
ECOSYSTEM_FILE="$DEPLOYMENT_DIR/ecosystem.json"

echo -e "\n${BLUE}[task]${NC} verifying deployment on app-1..."

run_test "deployment directory exists" "test -d $DEPLOYMENT_DIR" "app-1"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "current symlink exists" "test -L $CURRENT_SYMLINK" "app-1"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "current symlink points to deployment" "readlink $CURRENT_SYMLINK | grep -q \"deployment-$TEST_TAG\"" "app-1"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "ecosystem.json exists" "test -f $ECOSYSTEM_FILE" "app-1"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "app exec_mode is cluster" "grep -q '\"exec_mode\": \"cluster\"' $ECOSYSTEM_FILE" "app-1"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "worker exec_mode is cluster" "grep -q '\"name\": \"kibamail_worker\"' -A 5 $ECOSYSTEM_FILE | grep -q '\"exec_mode\": \"cluster\"'" "app-1"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "max_memory_restart is 0" "grep -q '\"max_memory_restart\": \"0\"' $ECOSYSTEM_FILE" "app-1"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "PM2 is running the application" "pm2 list | grep -q 'kibamail'" "app-1"
TEST_FAILURES=$((TEST_FAILURES + $?))

echo -e "\n${BLUE}[task]${NC} verifying deployment on app-2..."

run_test "deployment directory exists" "test -d $DEPLOYMENT_DIR" "app-2"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "current symlink exists" "test -L $CURRENT_SYMLINK" "app-2"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "current symlink points to deployment" "readlink $CURRENT_SYMLINK | grep -q \"deployment-$TEST_TAG\"" "app-2"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "ecosystem.json exists" "test -f $ECOSYSTEM_FILE" "app-2"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "app exec_mode is cluster" "grep -q '\"exec_mode\": \"cluster\"' $ECOSYSTEM_FILE" "app-2"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "worker exec_mode is cluster" "grep -q '\"name\": \"kibamail_worker\"' -A 5 $ECOSYSTEM_FILE | grep -q '\"exec_mode\": \"cluster\"'" "app-2"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "max_memory_restart is 0" "grep -q '\"max_memory_restart\": \"0\"' $ECOSYSTEM_FILE" "app-2"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "PM2 is running the application" "pm2 list | grep -q 'kibamail'" "app-2"
TEST_FAILURES=$((TEST_FAILURES + $?))

print_test_summary $TEST_FAILURES "deploy"
exit $?
