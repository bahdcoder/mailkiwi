# Deploy Role

This role provides zero-downtime deployment with git-based rollbacks for the Kibamail application.

## Features

- **Zero-downtime deployment**: Uses symlinks to atomically switch between deployments
- **Git-based deployments**: Deploys specific git tags
- **Rollback support**: Easily roll back to previous deployments
- **Smart redeployment**: Prevents redeploying the currently active tag, but allows reusing tags that aren't currently active
- **Root privileges**: Playbooks run with root privileges for full system access

- **Auto-startup**: Configures PM2 to start applications automatically on server boot
- **PM2 integration**: Uses PM2 for process management
- **Cleanup**: Automatically cleans up old deployments

## Requirements

- Node.js and pnpm installed on target servers
- Git installed on target servers
- PM2 installed globally on target servers

## Role Variables

See `defaults/main.yml` for a complete list of variables.

### Key Variables

- `pm2_instances`: Number of instances for the main application (default: 1)
- `pm2_worker_instances`: Number of instances for the worker process (default: 1)
- `infisical_service_token`: Required token for Infisical secrets management
- `keep_releases`: Number of deployments to keep (default: 24)

### PM2 Configuration

- Both the main application and worker processes run in cluster mode
- PM2 is configured to use all available memory on the server (no memory limit)
- PM2 is configured to start automatically on server boot

## Usage

### Deploying

Deploy a specific tag. The tag must be provided as an extra var:

```bash
ansible-playbook playbooks/app/deploy.yml --extra-vars "deploy_tag=v1.0.0 infisical_service_token=your_token"
```

You can also configure the number of worker instances:

```bash
ansible-playbook playbooks/app/deploy.yml --extra-vars "deploy_tag=v1.0.0 infisical_service_token=your_token pm2_worker_instances=2"
```

### Rolling Back

Roll back to a previously deployed tag. The tag must be provided as an extra var, and the deployment must exist on the server:

```bash
ansible-playbook playbooks/app/rollback.yml --extra-vars "rollback_tag=v0.9.0 infisical_service_token=your_token"
```

The system keeps the last 24 deployments by default, so you can roll back to any of those.

## Directory Structure

The role creates the following directory structure:

```
/var/www/kibamail/
├── current -> /var/www/kibamail/deployments/deployment-v1.0.0
└── deployments/
    ├── deployment-v0.9.0/
    ├── deployment-v0.9.5/
    └── deployment-v1.0.0/
```

- `current`: Symlink to the current deployment
- `deployments`: Contains all deployments

## Deployment Process

1. Check if the deployment directory already exists:
   - If it exists and is the current deployment, fail with an error
   - If it exists but is not the current deployment, remove it
2. Clone the repository at the specified tag
3. Install dependencies
4. Build the application
5. Atomically switch the symlink
6. Restart the application with PM2
7. Configure PM2 to start on server boot
8. Clean up old deployments

## Rollback Process

1. Check if the rollback deployment exists
2. Create a temporary symlink to the rollback deployment
3. Atomically switch the symlink
4. Restart the application with PM2
