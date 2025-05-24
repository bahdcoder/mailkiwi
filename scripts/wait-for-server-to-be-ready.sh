#!/bin/bash

# wait-for-server-to-be-ready.sh
# checks every 2 seconds if server running on PORT environment variable is online
# exits when port is available and online
# fails after 15 seconds if server is not ready

set -euo pipefail

# check if PORT environment variable is set
if [[ -z "${PORT:-}" ]]; then
    echo "❌ error: PORT environment variable is not set"
    exit 1
fi

# configuration
readonly MAX_WAIT_TIME=30
readonly CHECK_INTERVAL=2
readonly HOST="localhost"

# colors for beautiful logs
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # no color

# logging functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# function to check if server is ready
check_server() {
    if command -v nc >/dev/null 2>&1; then
        # use netcat if available
        nc -z "$HOST" "$PORT" >/dev/null 2>&1
    elif command -v curl >/dev/null 2>&1; then
        # use curl if netcat is not available
        curl -s --connect-timeout 1 "http://$HOST:$PORT" >/dev/null 2>&1
    elif command -v wget >/dev/null 2>&1; then
        # use wget if curl is not available
        wget -q --timeout=1 --tries=1 "http://$HOST:$PORT" -O /dev/null >/dev/null 2>&1
    else
        log_error "no suitable tool found (nc, curl, or wget required)"
        exit 1
    fi
}

# main execution
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log_info "waiting for server to be ready on port $PORT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

start_time=$(date +%s)
attempt=1

while true; do
    current_time=$(date +%s)
    elapsed_time=$((current_time - start_time))

    if [[ $elapsed_time -ge $MAX_WAIT_TIME ]]; then
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        log_error "timeout: server on port $PORT is not ready after ${MAX_WAIT_TIME} seconds"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        exit 1
    fi

    log_info "attempt $attempt: checking if server is ready on $HOST:$PORT..."

    if check_server; then
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        log_success "server is ready on port $PORT after ${elapsed_time} seconds"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        exit 0
    else
        log_warning "server not ready yet, waiting ${CHECK_INTERVAL} seconds..."
    fi

    sleep $CHECK_INTERVAL
    ((attempt++))
done