#!/bin/bash

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
source "$SCRIPT_DIR/../common/verify.sh"

source_vault_secrets

print_header "mysql backup verification"
echo -e "${BLUE}[task]${NC} verifying mysql backup..."

TEST_FAILURES=0

# Check if percona is properly installed
run_test "percona xtrabackup is installed" "dpkg -l | grep -q percona-xtrabackup-80" "mysql-master"
TEST_FAILURES=$((TEST_FAILURES + $?))

# Check if backup directory exists
run_test_as_user "backup directory exists" "test -d /var/backups/mysql/percona" "mysql-master" "mysql"
TEST_FAILURES=$((TEST_FAILURES + $?))

# Check if backup directory has correct permissions
run_test_as_user "backup directory has correct ownership" "stat -c '%U:%G' /var/backups/mysql/percona | grep -q 'mysql:mysql'" "mysql-master" "mysql"
TEST_FAILURES=$((TEST_FAILURES + $?))

# Check if there are any backup directories
run_test_as_user "backup files exist" "find /var/backups/mysql/percona -maxdepth 1 -type d -name 'backup-*' | wc -l | grep -q '[1-9]'" "mysql-master" "mysql"
TEST_FAILURES=$((TEST_FAILURES + $?))

# Check if latest symlink exists
run_test_as_user "latest backup symlink exists" "test -L /var/backups/mysql/percona/latest" "mysql-master" "mysql"
TEST_FAILURES=$((TEST_FAILURES + $?))

# Check if latest symlink points to a valid directory
run_test_as_user "latest backup symlink is valid" "test -L /var/backups/mysql/percona/latest && test -d \$(readlink -f /var/backups/mysql/percona/latest)" "mysql-master" "mysql"
TEST_FAILURES=$((TEST_FAILURES + $?))

# Check if xtrabackup_info file exists in the latest backup
run_test_as_user "xtrabackup_info exists in backup" "test -L /var/backups/mysql/percona/latest && test -f \$(readlink -f /var/backups/mysql/percona/latest)/xtrabackup_info" "mysql-master" "mysql"
TEST_FAILURES=$((TEST_FAILURES + $?))

# Check if backup is prepared (LSN in xtrabackup_checkpoints should match)
run_test_as_user "backup is properly prepared" "test -L /var/backups/mysql/percona/latest && grep -q 'to_lsn = [0-9]\\+' \$(readlink -f /var/backups/mysql/percona/latest)/xtrabackup_checkpoints" "mysql-master" "mysql"
TEST_FAILURES=$((TEST_FAILURES + $?))

print_test_summary $TEST_FAILURES "mysql backup"
exit $?
