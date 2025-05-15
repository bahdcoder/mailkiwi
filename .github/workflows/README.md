# GitHub Actions Workflows

This directory contains GitHub Actions workflows for the Kibamail project.

## Ansible Tests Workflow

The `ansible-tests.yml` workflow runs automated tests for the Ansible deployment scripts.

### Workflow Triggers

The workflow runs:
- On push to the `main` branch when files in the `ansible/` directory are changed
- On pull requests to the `main` branch when files in the `ansible/` directory are changed
- Manually via the GitHub Actions UI (workflow_dispatch)

### What the Workflow Does

1. **Setup Environment**:
   - Checks out the code
   - Sets up Python 3.10
   - Sets up Docker with buildx
   - Configures caching for Docker images

2. **Linting**:
   - Installs ansible-lint
   - Lints all Ansible files
   - Continues even if linting fails (to allow the tests to run)

3. **Run Tests**:
   - Makes all test scripts executable
   - Runs the main test script (`run-tests.sh`)
   - This script:
     - Sets up Docker containers
     - Configures SSH keys
     - Runs the Ansible playbook
     - Validates the setup
     - Cleans up resources

4. **Artifacts**:
   - Saves Docker images to cache for faster future runs
   - On failure, uploads test logs as artifacts for debugging

### Viewing Test Results

If the tests fail, you can:
1. Go to the failed workflow run
2. Navigate to the "Artifacts" section
3. Download the `ansible-test-logs` artifact
4. Review the logs to identify the issue

### Running the Workflow Manually

To run the workflow manually:
1. Go to the "Actions" tab in the GitHub repository
2. Select the "ansible tests" workflow
3. Click "Run workflow"
4. Select the branch to run the workflow on
5. Click "Run workflow"
