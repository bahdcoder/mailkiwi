# Kibamail Terraform Configuration

This directory contains Terraform configuration for provisioning the Kibamail infrastructure on Hetzner Cloud.

## Infrastructure Overview

- 2 app servers (app-1, app-2)
- 1 Redis server
- 2 mail servers (mail-1, mail-2)
- 1 mail proxy server
- 1 MySQL master server
- 1 MySQL slave server
- 1 monitoring server
- All servers run Ubuntu 24.04
- Private network with fixed IP addresses (no public IPs)

## Prerequisites

- Terraform (v1.0.0 or newer)
- Hetzner Cloud account with API token
- SSH keys already added to Hetzner Cloud with names:
  - "kibamail-staging" for staging environment
  - "kibamail-prod" for production environment

## Getting Started

1. Copy the example variables file for your environment:

```bash
# For staging
cp terraform.tfvars.example terraform.tfvars

# For production
cp terraform.tfvars.production.example terraform.tfvars
```

2. Edit `terraform.tfvars` to set your Hetzner Cloud API token.

3. Initialize and apply:

```bash
terraform init
terraform plan
terraform apply
```

## Server Configuration

The `user-data.sh` script sets up:
- System packages
- Essential packages
- Automatic security updates
- SSH hardening
- fail2ban
- System time and NTP
- Log rotation
- System limits
- ansible and semaphore users
- Secure umask
- Custom MOTD

## Ansible Integration

After provisioning, use Ansible to configure the servers. The Terraform output includes an Ansible inventory reference.

## File Structure

- `main.tf` - Main configuration
- `variables.tf` - Variable definitions
- `outputs.tf` - Output definitions
- `providers.tf` - Provider configuration
- `user-data.sh` - Initial server setup script
- `terraform.tfvars.example` - Staging example
- `terraform.tfvars.production.example` - Production example

## Environment Support

The configuration supports both staging and production environments:

- Staging: Uses `cpx21` server type with Ubuntu 24.04
- Production: Uses `cpx31` server type (more resources) with Ubuntu 24.04

Switch between environments by using the appropriate tfvars file.

## Network Configuration

All servers are configured with:
- No public IP addresses (public_net disabled)
- Only private network connectivity
- Fixed private IP addresses matching the Ansible inventory
- Delete and rebuild protection enabled for all resources

## Cleanup

Before destroying resources, you need to disable both delete and rebuild protection for all resources either through the Hetzner Cloud Console or by setting `delete_protection = false` and `rebuild_protection = false` in the Terraform configuration and running `terraform apply`.

```bash
# After disabling delete protection
terraform destroy
```
