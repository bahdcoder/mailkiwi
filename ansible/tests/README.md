# Ansible Tests

This directory contains tests for the Ansible deployment scripts.

## Directory Structure

- `docker/`: Docker files for test containers
- `inventory/`: Ansible inventory files for tests
- `logs/`: Test logs (created during test runs)
- `scripts/`: Test scripts

## Test Scripts

- `run-tests.sh`: Main test script that orchestrates the entire test process
- `cleanup-tests.sh`: Cleans up test containers and networks
- `generate-ssh-key.sh`: Generates SSH keys for testing
- `setup-ssh-keys.sh`: Sets up SSH keys and containers
- `run-ansible-playbook.sh`: Runs the Ansible playbook
- `validate-ansible-setup.sh`: Validates the Ansible setup

## Running Tests Locally

To run the tests locally:

```bash
cd ansible
./tests/scripts/run-tests.sh
```

This will:
1. Clean up any existing test containers
2. Generate SSH keys if needed
3. Set up Docker containers and SSH keys
4. Run the Ansible playbook
5. Validate the setup
6. Clean up resources

## Test Logs

All test output is logged to the `logs/` directory. Each test run creates three log files:

- `ansible-tests-YYYY-MM-DD-HH-MM-SS.log`: Main test log
- `ansible-playbook-YYYY-MM-DD-HH-MM-SS.log`: Ansible playbook output
- `ansible-validation-YYYY-MM-DD-HH-MM-SS.log`: Validation results

## CI Integration

These tests are integrated with GitHub Actions. The workflow runs automatically when changes are made to files in the `ansible/` directory.

See the `.github/workflows/ansible-tests.yml` file for details on the CI configuration.
