# GitHub Actions

This directory contains reusable GitHub Actions for our CI/CD workflows.

## Available Actions

### setup-node-pnpm

Sets up Node.js and PNPM with caching.

```yaml
- uses: ./.github/actions/setup-node-pnpm
  with:
    node-version: "22" # optional, defaults to '22'
    pnpm-version: "8" # optional, defaults to '8'
```

### install-dependencies

Installs project dependencies using PNPM.

```yaml
- uses: ./.github/actions/install-dependencies
  with:
    frozen-lockfile: "true" # optional, defaults to 'true'
```

### setup-docker

Sets up Docker services for testing.

```yaml
- uses: ./.github/actions/setup-docker
  with:
    wait-seconds: "10" # optional, defaults to '10'
```

### run-command

Runs a command.

```yaml
- uses: ./.github/actions/run-command
  with:
    name: "run tests"
    command: "pnpm test"
```

### setup-env-vars

Tools for managing environment variables in workflows. See the [README](./.github/actions/setup-env-vars/README.md) for more details.

## Creating a New Workflow

When creating a new workflow, you can use these reusable actions to reduce duplication. Here's an example:

```yaml
name: my workflow

on:
  pull_request:
    branches: [main]

jobs:
  my-job:
    name: my job
    runs-on: ubuntu-latest

    steps:
      - name: checkout code
        uses: actions/checkout@v4
      - uses: ./.github/actions/setup-node-pnpm
      - uses: ./.github/actions/install-dependencies

      - uses: ./.github/actions/run-command
        with:
          name: run my command
          command: pnpm my-command
```

If your workflow needs environment variables, you can use the `setup-env-vars` tools to generate a consistent set of environment variables.

## Updating Actions

When updating an action, make sure to update all workflows that use it if necessary.
