#!/bin/bash

export GREEN='\033[0;32m'
export BLUE='\033[0;34m'
export YELLOW='\033[1;33m'
export RED='\033[0;31m'
export CYAN='\033[0;36m'
export MAGENTA='\033[0;35m'
export BOLD='\033[1m'
export NC='\033[0m'

source_vault_secrets() {
    local script_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
    local ansible_dir="$( cd "$script_dir/../../../" && pwd )"
    local vault_file="$ansible_dir/vault_secrets.txt"

    if [ -f "$vault_file" ]; then
        echo -e "${BLUE}[task]${NC} loading secrets from vault_secrets.txt..."
        source "$vault_file"

        local loaded_vars=()

        if [ -n "$MYSQL_ROOT_USER_PASSWORD" ]; then
            export MYSQL_ROOT_USER_PASSWORD
            loaded_vars+=("MYSQL_ROOT_USER_PASSWORD")
        fi

        if [ -n "$MYSQL_KIBAMAIL_USER_PASSWORD" ]; then
            export MYSQL_KIBAMAIL_USER_PASSWORD
            loaded_vars+=("MYSQL_KIBAMAIL_USER_PASSWORD")
        fi

        if [ -n "$MYSQL_REPLICATION_PASSWORD" ]; then
            export MYSQL_REPLICATION_PASSWORD
            loaded_vars+=("MYSQL_REPLICATION_PASSWORD")
        fi

        if [ -n "$MYSQL_XTRA_BACKUP_PASSWORD" ]; then
            export MYSQL_XTRA_BACKUP_PASSWORD
            loaded_vars+=("MYSQL_XTRA_BACKUP_PASSWORD")
        fi

        if [ -n "$REDIS_DB_PASSWORD" ]; then
            export REDIS_DB_PASSWORD
            loaded_vars+=("REDIS_DB_PASSWORD")
        fi

        if [ ${#loaded_vars[@]} -gt 0 ]; then
            echo -e "${GREEN}[success]${NC} loaded ${#loaded_vars[@]} variables from vault_secrets.txt: ${loaded_vars[*]}"
            return 0
        else
            echo -e "${YELLOW}[warning]${NC} no known variables found in vault_secrets.txt"
            return 1
        fi
    else
        echo -e "${YELLOW}[warning]${NC} vault_secrets.txt not found at $vault_file"
        return 2
    fi
}

# Function to print a header
print_header() {
    local test_name="$1"

    echo -e "${BOLD}${MAGENTA}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BOLD}${MAGENTA}║              ${CYAN}${test_name}${MAGENTA}                ${NC}"
    echo -e "${BOLD}${MAGENTA}╚════════════════════════════════════════════════════════╝${NC}"
    echo
}

# Function to print a footer
print_footer() {
    local footer_text="$1"
    local footer_color="$2"

    echo
    echo -e "${footer_color}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${footer_color}║              ${CYAN}${footer_text}${footer_color}                ${NC}"
    echo -e "${footer_color}╚════════════════════════════════════════════════════════╝${NC}"
}

run_playbook() {
    local playbook_path="$1"
    local test_name="$2"
    local inventory="${3:-inventory/staging/hosts}"

    local script_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
    local ansible_dir="$( cd "$script_dir/../../../" && pwd )"

    cd "$ansible_dir"

    echo -e "${BLUE}[task]${NC} running ${test_name} in ansible-root vm..."

    source_vault_secrets

    local extra_vars=""

    if [ -n "$MYSQL_ROOT_USER_PASSWORD" ] && [ -n "$MYSQL_KIBAMAIL_USER_PASSWORD" ] && [ -n "$MYSQL_REPLICATION_PASSWORD" ]; then
        extra_vars="-e vault_mysql_root_password='$MYSQL_ROOT_USER_PASSWORD' -e vault_mysql_kibamail_password='$MYSQL_KIBAMAIL_USER_PASSWORD' -e vault_mysql_replication_password='$MYSQL_REPLICATION_PASSWORD'"

        if [ -n "$MYSQL_XTRA_BACKUP_PASSWORD" ]; then
            extra_vars="$extra_vars -e vault_mysql_xtra_backup_password='$MYSQL_XTRA_BACKUP_PASSWORD'"
        fi
    fi

    if [ -n "$REDIS_DB_PASSWORD" ]; then
        extra_vars="$extra_vars -e vault_redis_password='$REDIS_DB_PASSWORD'"
    fi

    # Run the playbook with extra vars if available
    if [ -n "$extra_vars" ]; then
        echo -e "${BLUE}[task]${NC} running playbook with secrets..."
        vagrant ssh ansible-root -c "cd /ansible && sudo -u ansible ansible-playbook -i ${inventory} ${playbook_path} ${extra_vars} -vv"
    else
        vagrant ssh ansible-root -c "cd /ansible && sudo -u ansible ansible-playbook -i ${inventory} ${playbook_path} -vv"
    fi
    local exit_code=$?

    # Check if playbook execution was successful
    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}[success]${NC} ${test_name} executed successfully!"
        print_footer "${test_name} completed" "$MAGENTA"
        return 0
    else
        echo -e "${RED}[error]${NC} ${test_name} execution failed!"
        print_footer "${test_name} failed" "$RED"
        return 1
    fi
}

# Function to run a verification script
run_verification() {
    local verify_script="$1"
    local test_name="$2"

    if [ -f "$verify_script" ]; then
        chmod +x "$verify_script"

        echo -e "${BLUE}[task]${NC} running verification for ${test_name}..."

        # Source vault secrets before running verification
        source_vault_secrets

        # Run the verification script
        "$verify_script"
        return $?
    else
        echo -e "${YELLOW}[warning]${NC} no verification script found for ${test_name}"
        return 0
    fi
}
