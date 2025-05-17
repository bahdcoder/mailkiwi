#!/bin/bash

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
source "$SCRIPT_DIR/../common/verify.sh"

print_header "mysql setup verification"
echo -e "${BLUE}[task]${NC} verifying mysql setup..."

TEST_FAILURES=0

run_test "mysql is running" "systemctl is-active mysql" "mysql-master"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "mysql is running" "systemctl is-active mysql" "mysql-slave"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "kibamail database exists" "sudo mysql -e 'SHOW DATABASES;' | grep -q kibamail" "mysql-master"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "kibamail database exists" "sudo mysql -e 'SHOW DATABASES;' | grep -q kibamail" "mysql-slave"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "replication io is running" "sudo mysql -e 'SHOW SLAVE STATUS\\G' | grep -q 'Slave_IO_Running: Yes'" "mysql-slave"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "replication is running" "sudo mysql -e 'SHOW SLAVE STATUS\\G' | grep -q 'Slave_SQL_Running: Yes'" "mysql-slave"
TEST_FAILURES=$((TEST_FAILURES + $?))

print_test_summary $TEST_FAILURES "mysql"
exit $?
