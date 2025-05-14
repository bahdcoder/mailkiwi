# Staging Environment Ansible Configuration

This directory contains the Ansible inventory and variables for the staging environment of Kibamail.

## Structure

- `inventory.yaml`: Defines the hosts and groups for the staging environment
- `group_vars/`: Contains variables for each host group
  - `all.yml`: Common variables for all hosts
  - `all/vault.yml`: Encrypted sensitive variables for all hosts
  - `app.yml`: Variables for application servers
  - `dragonfly.yml`: Variables for Dragonfly (Redis alternative) servers
  - `mail.yml`: Variables for mail servers
  - `mail_proxy.yml`: Variables for mail proxy servers
  - `mysql_master.yml`: Variables for MySQL master servers
  - `mysql_slave.yml`: Variables for MySQL slave servers
  - `monitoring.yml`: Variables for monitoring servers

## Usage

### Encrypting Sensitive Data

Before using this configuration in production, encrypt the vault file:

```bash
ansible-vault encrypt ansible/inventory/staging/group_vars/all/vault.yml
```

### Running Playbooks

To run a playbook with this inventory:

```bash
ansible-playbook -i ansible/inventory/staging/inventory.yaml playbooks/deploy.yml --ask-vault-pass
```

## Important Notes

1. Replace all placeholder passwords and tokens in `vault.yml` with strong, unique values
2. Ensure SSH keys are properly configured for the `ansible_user`
3. Review firewall settings to ensure only necessary ports are open
4. Update domain names and IP addresses to match your actual infrastructure

## Variables Reference

Each group_vars file contains variables specific to that server role:

- `all.yml`: Common settings like SSH, deployment paths, git repository
- `app.yml`: NodeJS application settings, PM2 configuration, Nginx virtual hosts
- `dragonfly.yml`: Dragonfly (Redis alternative) server configuration
- `mail.yml`: KumoMTA mail server configuration
- `mail_proxy.yml`: HAProxy configuration for mail load balancing
- `mysql_master.yml`: MySQL master server configuration
- `mysql_slave.yml`: MySQL slave server configuration
- `monitoring.yml`: Prometheus, Grafana, and alerting configuration
