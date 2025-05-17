#!/bin/bash

# test_lib.sh - common functions for ansible test scripts

# define color codes
export GREEN='\033[0;32m'
export BLUE='\033[0;34m'
export YELLOW='\033[1;33m'
export RED='\033[0;31m'
export CYAN='\033[0;36m'
export MAGENTA='\033[0;35m'
export BOLD='\033[1m'
export NC='\033[0m' # no color

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

# Function to run a playbook
run_playbook() {
    local playbook_path="$1"
    local test_name="$2"
    local inventory="${3:-inventory/staging/inventory.yaml}"

    # Get the script directory
    local script_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
    local ansible_dir="$( cd "$script_dir/../../../" && pwd )"
    
    # Change to ansible directory
    cd "$ansible_dir"
    
    # Print task message
    echo -e "${BLUE}[task]${NC} running ${test_name} in ansible-root vm..."
    
    # Run the playbook
    vagrant ssh ansible-root -c "cd /ansible && sudo -u ansible ansible-playbook -i ${inventory} ${playbook_path} -v"
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
        # Make sure verify.sh is executable
        chmod +x "$verify_script"
        
        # Run verification
        echo -e "${BLUE}[task]${NC} running verification for ${test_name}..."
        "$verify_script"
        return $?
    else
        echo -e "${YELLOW}[warning]${NC} no verification script found for ${test_name}"
        return 0
    fi
}
