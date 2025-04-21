# Environment Variables Setup

This directory contains tools to help manage environment variables in GitHub Actions workflows.

## Usage

When creating a new workflow that needs environment variables, you can use the template in `env-template.txt` to ensure consistency.

To generate the environment variables section for a workflow file:

```bash
node .github/actions/setup-env-vars/generate-env.js [NODE_ENV]
```

Where `[NODE_ENV]` is the value for the NODE_ENV variable (defaults to "test" if not provided).

Example:

```bash
# Generate environment variables for a test workflow
node .github/actions/setup-env-vars/generate-env.js test

# Generate environment variables for a production workflow
node .github/actions/setup-env-vars/generate-env.js production
```

Copy the output and paste it into your workflow file under the `env:` section.

## Updating Environment Variables

If you need to add, remove, or modify environment variables:

1. Update the `env-template.txt` file
2. Regenerate the environment variables section for each workflow file
3. Update the workflow files with the new environment variables section

This ensures that all workflows use a consistent set of environment variables.
