#!/bin/bash

# define color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m' # no color

# initialize failure flag
FAILURE=0

# parse command line arguments
SPECIFIED_VMS=""
for arg in "$@"; do
  case $arg in
    --vms=*)
      SPECIFIED_VMS="${arg#*=}"
      shift
      ;;
    *)
      # unknown option
      ;;
  esac
done

# print header
echo -e "${BOLD}${MAGENTA}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${MAGENTA}║              ${CYAN}kibamail vagrant manager${MAGENTA}                ║${NC}"
echo -e "${BOLD}${MAGENTA}╚════════════════════════════════════════════════════════╝${NC}"
echo

echo -e "${BLUE}[task]${NC} ${BOLD}preparing to process vagrant vms...${NC}"

# hardcoded list of all vms
all_vm_names=(
  "app-1"
  "app-2"
  "redis"
  "mail-1"
  "mail-2"
  "mail-proxy"
  "mysql-master"
  "mysql-slave"
  "monitoring"
  "ansible-root"
)

# determine which vms to process
if [ -n "$SPECIFIED_VMS" ]; then
  # convert comma-separated list to array
  IFS=',' read -ra vm_names <<< "$SPECIFIED_VMS"
  echo -e "${YELLOW}[info]${NC} processing specified vms: ${CYAN}${SPECIFIED_VMS}${NC}"
else
  # use all vms if none specified
  vm_names=("${all_vm_names[@]}")
  echo -e "${YELLOW}[info]${NC} processing all vms"
fi

# function to get ip for a vm
get_ip() {
  local vm=$1
  case $vm in
    "app-1")        echo "172.16.0.3" ;;
    "app-2")        echo "172.16.0.2" ;;
    "redis")    echo "172.16.0.11" ;;
    "mail-1")       echo "172.16.0.10" ;;
    "mail-2")       echo "172.16.0.5" ;;
    "mail-proxy")   echo "172.16.0.6" ;;
    "mysql-master") echo "172.16.0.9" ;;
    "mysql-slave")  echo "172.16.0.8" ;;
    "monitoring")   echo "172.16.0.4" ;;
    "ansible-root") echo "172.16.0.100" ;;
    *)              echo "unknown" ;;
  esac
}

echo -e "${GREEN}[info]${NC} found ${CYAN}${#vm_names[@]}${NC} vagrant vms to process"
echo

# loop through each vm
for vm in "${vm_names[@]}"; do
  ip=$(get_ip "$vm")
  echo -e "${BLUE}[vm]${NC} ${BOLD}processing vm: ${CYAN}$vm${NC} (${YELLOW}$ip${NC})${BOLD}...${NC}"

  # check if vm is running
  echo -e "${CYAN}•${NC} checking vm status..."
  status=$(vagrant status $vm --machine-readable | grep "$vm,state," | cut -d',' -f4)

  if [ "$status" != "running" ]; then
    echo -e "${YELLOW}[status]${NC} vm is ${YELLOW}not running${NC}"
    echo -e "${CYAN}•${NC} starting vm with parallels provider..."

    if ! vagrant up $vm --provider=parallels; then
      echo -e "${RED}[error]${NC} ${BOLD}failed to start vm: ${CYAN}$vm${NC}${BOLD}!${NC}"
      FAILURE=1
      continue
    fi

    echo -e "${GREEN}[success]${NC} vm started successfully"
    echo -e "${CYAN}•${NC} taking snapshot of vm..."

    if ! vagrant snapshot save $vm initial; then
      echo -e "${RED}[error]${NC} ${BOLD}failed to take snapshot of vm: ${CYAN}$vm${NC}${BOLD}!${NC}"
      FAILURE=1
      continue
    fi

    echo -e "${GREEN}[success]${NC} snapshot taken successfully"
  else
    echo -e "${GREEN}[status]${NC} vm is ${GREEN}running${NC}"

    # check if snapshot exists
    echo -e "${CYAN}•${NC} checking for existing snapshot..."
    if vagrant snapshot list $vm | grep -q "initial"; then
      echo -e "${GREEN}[info]${NC} snapshot exists for vm"
      echo -e "${CYAN}•${NC} restoring vm to snapshot..."

      if ! vagrant snapshot restore $vm initial; then
        echo -e "${RED}[error]${NC} ${BOLD}failed to restore snapshot for vm: ${CYAN}$vm${NC}${BOLD}!${NC}"
        FAILURE=1
        continue
      fi

      echo -e "${GREEN}[success]${NC} snapshot restored successfully"
    else
      echo -e "${YELLOW}[info]${NC} no snapshot found for vm"
      echo -e "${CYAN}•${NC} taking snapshot of vm..."

      if ! vagrant snapshot save $vm initial; then
        echo -e "${RED}[error]${NC} ${BOLD}failed to take snapshot of vm: ${CYAN}$vm${NC}${BOLD}!${NC}"
        FAILURE=1
        continue
      fi

      echo -e "${GREEN}[success]${NC} snapshot taken successfully"
    fi
  fi
  echo
done

# final status
if [ $FAILURE -eq 0 ]; then
  echo -e "${GREEN}[success]${NC} ${BOLD}all vms processed successfully!${NC}"
  FOOTER_COLOR=$MAGENTA
  FOOTER_TEXT="vagrant manager completed"
else
  echo -e "${RED}[error]${NC} ${BOLD}one or more vms failed to process!${NC}"
  FOOTER_COLOR=$RED
  FOOTER_TEXT="vagrant manager failed"
fi

echo

# print footer
echo -e "${FOOTER_COLOR}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${FOOTER_COLOR}║              ${CYAN}$FOOTER_TEXT${FOOTER_COLOR}                ${NC}"
echo -e "${FOOTER_COLOR}╚════════════════════════════════════════════════════════╝${NC}"

exit $FAILURE
