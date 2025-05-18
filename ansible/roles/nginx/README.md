# NGINX Role

This role installs and configures NGINX as a reverse proxy for Kibamail application servers.

## Configuration

Each app server (app-1, app-2) runs its own NGINX instance on port 80, which proxies requests to the local application running on port 5566. Hetzner handles load balancing traffic between both NGINX hosts.

The role creates the necessary directory structure for NGINX configuration:
- `/etc/nginx/sites-available/` - Contains available site configurations
- `/etc/nginx/sites-enabled/` - Contains symlinks to enabled site configurations
- `/etc/nginx/modules-enabled/` - Contains enabled modules
- `/etc/nginx/conf.d/` - Contains additional configuration files

### Features

- Listens on port 80
- Proxies all traffic to the local application server on port 5566
- Sets standard proxy headers (Host, X-Real-IP, X-Forwarded-For, X-Forwarded-Proto)
- Supports WebSocket upgrades
- Enables gzip compression for performance
- Provides a /healthz endpoint for health checks
- Configures access and error logs

## Variables

| Variable | Description | Default |
|----------|-------------|---------|
| nginx_port | Port NGINX listens on | 80 |
| app_server_port | Port the application server listens on | 5566 |
| nginx_firewall_enabled | Whether to configure UFW firewall | true |
| nginx_access_log | Path to access log | /var/log/nginx/app_access.log |
| nginx_error_log | Path to error log | /var/log/nginx/app_error.log |

## Usage

Include this role in your playbook:

```yaml
- name: setup nginx reverse proxy
  hosts: app
  become: true
  roles:
    - nginx
```
