#!/bin/bash

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
source "$SCRIPT_DIR/../common/verify.sh"

source_vault_secrets

print_header "app setup verification"
echo -e "${BLUE}[task]${NC} verifying app setup..."

TEST_FAILURES=0

# Build dependencies tests for app-1
echo -e "\n${BLUE}[task]${NC} verifying build dependencies on app-1..."

run_test "build-essential is installed" "dpkg -l | grep -q 'build-essential'" "app-1"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "python3 is installed" "which python3" "app-1"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "g++ is installed" "which g++" "app-1"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "make is installed" "which make" "app-1"
TEST_FAILURES=$((TEST_FAILURES + $?))

# Build dependencies tests for app-2
echo -e "\n${BLUE}[task]${NC} verifying build dependencies on app-2..."

run_test "build-essential is installed" "dpkg -l | grep -q 'build-essential'" "app-2"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "python3 is installed" "which python3" "app-2"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "g++ is installed" "which g++" "app-2"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "make is installed" "which make" "app-2"
TEST_FAILURES=$((TEST_FAILURES + $?))

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

# NGINX verification for app-1
echo -e "\n${BLUE}[task]${NC} verifying nginx on app-1..."

run_test "nginx binary exists" "which nginx" "app-1"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "nginx service is running" "systemctl is-active nginx" "app-1"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "nginx service is enabled" "systemctl is-enabled nginx" "app-1"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "nginx configuration is valid" "sudo nginx -t 2>&1 | grep -q 'test is successful'" "app-1"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "nginx configuration syntax is ok" "sudo nginx -t 2>&1 | grep -q 'syntax is ok'" "app-1"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "nginx sites-available directory exists" "test -d /etc/nginx/sites-available" "app-1"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "nginx sites-enabled directory exists" "test -d /etc/nginx/sites-enabled" "app-1"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "app.conf exists in sites-available" "test -f /etc/nginx/sites-available/app.conf" "app-1"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "app.conf is symlinked in sites-enabled" "test -L /etc/nginx/sites-enabled/app.conf" "app-1"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "nginx is listening on port 80" "netstat -tuln | grep -q ':80 '" "app-1"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "SSH is listening on port 22" "netstat -tuln | grep -q ':22 '" "app-1"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "port 80 is allowed in UFW" "sudo ufw status | grep -q '80/tcp.*ALLOW'" "app-1"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "port 22 is allowed in UFW" "sudo ufw status | grep -q '22/tcp.*ALLOW'" "app-1"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "app.conf contains proxy_pass directive" "grep -q 'proxy_pass http://localhost:5566' /etc/nginx/sites-available/app.conf" "app-1"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "app.conf contains healthz endpoint" "grep -q 'location /healthz' /etc/nginx/sites-available/app.conf" "app-1"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "healthz endpoint returns 200" "curl -s -o /dev/null -w '%{http_code}' http://localhost/healthz | grep -q '200'" "app-1"
TEST_FAILURES=$((TEST_FAILURES + $?))

echo -e "\n${BLUE}[task]${NC} verifying nginx on app-2..."

run_test "nginx binary exists" "which nginx" "app-2"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "nginx service is running" "systemctl is-active nginx" "app-2"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "nginx service is enabled" "systemctl is-enabled nginx" "app-2"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "nginx configuration is valid" "sudo nginx -t 2>&1 | grep -q 'test is successful'" "app-2"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "nginx configuration syntax is ok" "sudo nginx -t 2>&1 | grep -q 'syntax is ok'" "app-2"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "nginx sites-available directory exists" "test -d /etc/nginx/sites-available" "app-2"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "nginx sites-enabled directory exists" "test -d /etc/nginx/sites-enabled" "app-2"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "app.conf exists in sites-available" "test -f /etc/nginx/sites-available/app.conf" "app-2"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "app.conf is symlinked in sites-enabled" "test -L /etc/nginx/sites-enabled/app.conf" "app-2"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "nginx is listening on port 80" "netstat -tuln | grep -q ':80 '" "app-2"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "SSH is listening on port 22" "netstat -tuln | grep -q ':22 '" "app-2"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "port 80 is allowed in ufw" "sudo ufw status | grep -q '80/tcp.*ALLOW'" "app-2"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "port 22 is allowed in ufw" "sudo ufw status | grep -q '22/tcp.*ALLOW'" "app-2"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "app.conf contains proxy_pass directive" "grep -q 'proxy_pass http://localhost:5566' /etc/nginx/sites-available/app.conf" "app-2"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "app.conf contains healthz endpoint" "grep -q 'location /healthz' /etc/nginx/sites-available/app.conf" "app-2"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "healthz endpoint returns 200" "curl -s -o /dev/null -w '%{http_code}' http://localhost/healthz | grep -q '200'" "app-2"
TEST_FAILURES=$((TEST_FAILURES + $?))

print_test_summary $TEST_FAILURES "app"
exit $?
