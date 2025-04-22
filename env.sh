#!/bin/bash

#############################################################################
# KibaMail Environment Configuration Script
#############################################################################
#
# OVERVIEW:
# This script is used to run commands with environment variables loaded from
# Infisical, a secrets management platform. It allows you to execute any command
# with the appropriate environment variables for different deployment environments.
#
# PREREQUISITES:
# - Infisical CLI must be installed (https://infisical.com/docs/cli/overview)
# - You do not need direct access to the Kibamail core engineering team
# to be able to run this script. This script is prepopulated with a
# service token that gives you access to the test and dev
# environment variables for the Kibamail platform.
#
# USAGE:
#   ./env.sh [options] -- command [args...]
#
# EXAMPLES:
#   ./env.sh --env=dev -- pnpm dev
#   ./env.sh --env=test -- pnpm test
#   ./env.sh --env=prod --infisical-token=your-token -- pnpm start
#
# OPTIONAL ENVIRONMENT VARIABLES:
#   INFISICAL_TOKEN - Can be set to override the default token
# If you're a Github contributor seeking to raise a pull
# request, you do not need to set this environment
# variable as the script comes preloaded with
# a service token already.
#
# CUSTOMIZATION:
#   To use this script with a different project:
#   1. Update the PROJECT_ID value
#   2. Update the DOMAIN value if using a custom Infisical instance
#   3. Update the TOKEN value with your service token
#   4. Modify the validate_env function to include your environment names
#

# Default values - These can be customized for your specific setup

# Default environment to use
ENV="dev"

# Infisical project ID
PROJECT_ID="bafb9e20-f556-4b20-b91c-cea0b81ff8a8"

# Our self-hosted innfisical instance domain
DOMAIN="https://infisical.kibamail.com"

# Default service token
TOKEN="st.32a86483-d1c1-486f-947b-b4b9ae759a00.af281b043bc0e67ac18bef38e84e1655.36b9a37d7b9efba36e1d60220acba157"

# The command we want to inject secrets into
COMMAND=""                                     # Will store the command to execute

# Function to display usage information
# This function prints help text showing how to use the script and exits with error code 1
usage() {
    echo "Usage: $0 [options] -- command [args...]"
    echo "Options:"
    echo "  --env=<environment>       Set environment (dev, test, test-playwright, prod, stage)"
    echo "  --infisical-token=<token>  Override the default Infisical token"
    echo "Examples:"
    echo "  $0 --env=dev -- pnpm run start"
    echo "  $0 --env=test -- pnpm run test"
    echo "  $0 --env=prod --infisical-token=your-token -- node server.js"
    exit 1
}

# Function to validate environment
# This function checks if the provided environment name is valid
# Parameters:
#   $1 - The environment name to validate
# Returns:
#   0 if valid, otherwise displays error and exits
# Note: Customize the case statement to add or remove valid environments
validate_env() {
    case "$1" in
        dev|test|test-playwright|prod|stage)
            return 0
            ;;
        *)
            echo "Error: Invalid environment '$1'. Valid options are: dev, test, test-playwright, prod, stage"
            usage  # Fixed typo: was 'usaged'
            ;;
    esac
}

# Parse command line arguments
# This section processes all command line options passed to the script
# Supported options:
#   --env=<name>            - Set the environment (dev, test, test-playwright, prod, stage)
#   --infisical-token=<token> - Override the default Infisical token
#   --                      - Separator between options and the command to run
#
# Note: To add new command line options, add new case statements here
while [[ $# -gt 0 ]]; do
    case "$1" in
        --env=*)
            ENV="${1#*=}"  # Extract value after '=' character
            validate_env "$ENV"
            shift
            ;;
        --infisical-token=*)
            TOKEN="${1#*=}"  # Extract value after '=' character
            shift
            ;;
        --)
            shift
            COMMAND="$@"  # Everything after -- becomes the command to execute
            break
            ;;
        *)
            echo "Error: Unknown option '$1'"
            usage
            ;;
    esac
done

# Check if INFISICAL_TOKEN environment variable is set
# This allows users to set the token via environment variable instead of command line
# Priority: Environment variable > Command line parameter > Default value
if [ -n "$INFISICAL_TOKEN" ]; then
    TOKEN="$INFISICAL_TOKEN"
fi

# Validate that a command was provided
# The script requires a command to execute with the environment variables
if [ -z "$COMMAND" ]; then
    echo "Error: No command specified"
    usage
fi

# Execute the command with Infisical
# This section runs the specified command with environment variables loaded from Infisical
echo "Running with environment: $ENV"

# Set the Infisical token as an environment variable
export INFISICAL_TOKEN=${TOKEN}

# Run the command using Infisical CLI
# The infisical run command will:
# 1. Connect to the Infisical server specified by DOMAIN
# 2. Load environment variables for the specified ENV from the project (PROJECT_ID)
# 3. Execute the COMMAND with those environment variables
infisical run --env="$ENV" --domain="$DOMAIN" --projectId="$PROJECT_ID" -- $COMMAND

# Exit with the same exit code as the command that was run
# This ensures that if the command fails, this script also returns a failure exit code
