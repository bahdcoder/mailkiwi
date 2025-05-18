#!/bin/bash

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
source "$SCRIPT_DIR/../common/verify.sh"

source_vault_secrets

print_header "redis setup verification"
echo -e "${BLUE}[task]${NC} verifying redis setup..."

TEST_FAILURES=0

run_test "redis is installed" "which redis-server" "redis"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "redis service is running" "systemctl is-active redis-server" "redis"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "redis is listening on port 6379" "ss -tuln | grep -q ':6379'" "redis"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "redis is bound to all IPs" "grep -q 'bind 0.0.0.0' /etc/redis/redis.conf" "redis"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_redis_cli_test() {
    local test_name="$1"
    local redis_command="$2"
    local expected_output="$3"

    local full_command="redis-cli -h localhost -p 6379 -a \"$REDIS_DB_PASSWORD\" $redis_command | grep -q '$expected_output'"

    run_test "$test_name" "$full_command" "redis"
    return $?
}

run_redis_cli_test "redis is accessible with password" "ping" "PONG"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_redis_cli_test "redis has 8 databases" "CONFIG GET databases" "8"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "redis data directory exists" "test -d /var/lib/redis" "redis"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "redis log directory exists" "test -d /var/log/redis" "redis"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "redis backup directory exists" "test -d /var/backups/redis" "redis"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_redis_cli_test "redis is configured for AOF persistence" "CONFIG GET appendonly" "yes"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_redis_cli_test "redis is configured for AOF fsync always" "CONFIG GET appendfsync" "always"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "ufw is installed" "which ufw" "redis"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "ufw is enabled" "sudo ufw status | grep -q 'Status: active'" "redis"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "ssh port is allowed in firewall" "sudo ufw status | grep -q '22/tcp.*ALLOW'" "redis"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "redis port is allowed in firewall" "sudo ufw status | grep -q '6379/tcp.*ALLOW'" "redis"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "redis port is allowed from any IP" "sudo ufw status | grep -q '6379/tcp.*ALLOW.*Anywhere'" "redis"
TEST_FAILURES=$((TEST_FAILURES + $?))

print_test_summary $TEST_FAILURES "redis"
exit $?
