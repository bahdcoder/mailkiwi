#!/bin/bash

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
source "$SCRIPT_DIR/../common/verify.sh"

source_vault_secrets

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

run_test "mysql master is bound to all IPs" "sudo mysql -e 'SHOW VARIABLES LIKE \"bind_address\";' | grep -q '0.0.0.0'" "mysql-master"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "mysql slave is bound to all IPs" "sudo mysql -e 'SHOW VARIABLES LIKE \"bind_address\";' | grep -q '0.0.0.0'" "mysql-slave"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "replication io is running" "sudo mysql -e 'SHOW SLAVE STATUS\\G' | grep -q 'Slave_IO_Running: Yes'" "mysql-slave"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "replication is running" "sudo mysql -e 'SHOW SLAVE STATUS\\G' | grep -q 'Slave_SQL_Running: Yes'" "mysql-slave"
TEST_FAILURES=$((TEST_FAILURES + $?))

# Check for percona xtrabackup on master
echo -e "${BLUE}[task]${NC} verifying percona xtrabackup setup..."

run_test "percona xtrabackup is installed" "dpkg -l | grep -q percona-xtrabackup-80" "mysql-master"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "percona xtrabackup is executable" "which xtrabackup" "mysql-master"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "percona xtrabackup version check" "xtrabackup --version 2>&1 | grep -q 'xtrabackup version'" "mysql-master"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "percona backup user exists" "sudo mysql -e \"SELECT User FROM mysql.user WHERE User='percona';\" | grep -q percona" "mysql-master"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "percona backup user has correct privileges" "sudo mysql -e \"SHOW GRANTS FOR 'percona'@'localhost';\" | grep -q 'RELOAD'" "mysql-master"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "backup directory exists" "sudo test -d /var/backups/mysql/percona" "mysql-master"
TEST_FAILURES=$((TEST_FAILURES + $?))

run_test "backup directory has correct ownership" "sudo stat -c '%U:%G' /var/backups/mysql/percona | grep -q 'mysql:mysql'" "mysql-master"
TEST_FAILURES=$((TEST_FAILURES + $?))

print_test_summary $TEST_FAILURES "mysql"
exit $?
