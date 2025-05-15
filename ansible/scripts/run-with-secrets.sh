#!/bin/bash

# run-with-secrets.sh - run ansible playbooks with secrets from vault_secrets.txt

# define color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # no color

# check if vault_secrets.txt exists
if [ ! -f "vault_secrets.txt" ]; then
    echo -e "${RED}[error]${NC} vault_secrets.txt not found. run setup-infisical.sh first."
    exit 1
fi

# check if playbook is provided
if [ $# -lt 1 ]; then
    echo -e "${RED}[error]${NC} usage: $0 <playbook> [environment] [extra args...]"
    echo -e "${YELLOW}[info]${NC} example: $0 playbooks/mysql/setup.yml staging -v"
    exit 1
fi

PLAYBOOK=$1
shift

# check if environment is provided
ENV=${1:-staging}
if [[ "$1" =~ ^(staging|prod)$ ]]; then
    shift
fi

# source the vault_secrets.txt file to set environment variables
echo -e "${BLUE}[task]${NC} loading secrets from vault_secrets.txt..."
source vault_secrets.txt

# check if required variables are set
if [ -z "$MYSQL_ROOT_USER_PASSWORD" ] || [ -z "$MYSQL_KIBAMAIL_USER_PASSWORD" ]; then
    echo -e "${RED}[error]${NC} mysql credentials not found in vault_secrets.txt."
    echo -e "${YELLOW}[info]${NC} run setup-infisical.sh to fetch the required secrets."
    exit 1
fi

# check for placeholder values
if [[ "$MYSQL_ROOT_USER_PASSWORD" == *"change_me_in_production"* ]] || [[ "$MYSQL_KIBAMAIL_USER_PASSWORD" == *"change_me_in_production"* ]]; then
    echo -e "${RED}[error]${NC} placeholder values detected in vault_secrets.txt."
    echo -e "${RED}[error]${NC} these values should not be used in production."
    echo -e "${YELLOW}[info]${NC} run setup-infisical.sh again to fetch the actual secrets."
    exit 1
fi

# determine inventory based on environment
INVENTORY="inventory/staging"
if [ "$ENV" == "prod" ]; then
    INVENTORY="inventory/production"
fi

# run the playbook
echo -e "${BLUE}[task]${NC} running playbook with secrets from vault_secrets.txt..."
echo -e "${CYAN}•${NC} playbook: ${YELLOW}$PLAYBOOK${NC}"
echo -e "${CYAN}•${NC} environment: ${YELLOW}$ENV${NC}"
echo -e "${CYAN}•${NC} inventory: ${YELLOW}$INVENTORY${NC}"
echo

# pass the secrets as extra vars
ansible-playbook -i $INVENTORY $PLAYBOOK \
  -e "mysql_root_password=$MYSQL_ROOT_USER_PASSWORD" \
  -e "mysql_app_password=$MYSQL_KIBAMAIL_USER_PASSWORD" \
  "$@"

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}[success]${NC} playbook executed successfully!"
else
    echo -e "${RED}[error]${NC} playbook execution failed!"
fi

exit $EXIT_CODE
