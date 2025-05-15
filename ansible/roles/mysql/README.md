# mysql role

this role installs and configures mysql 8.0.43 for production use with a focus on security and performance.

## features

- installs mysql 8.0.43 from official mysql repositories
- configures mysql with production-grade settings
- secures the mysql installation (removes test databases, anonymous users, etc.)
- creates a kibamail database with utf8mb4 encoding
- creates a kibamail user with a secure random 32-character password
- sets up master-slave replication with gtid
- configures automated backups using percona xtrabackup with retention policy
- enables binary logging for point-in-time recovery
- optimizes performance settings for production workloads

## variables

see `defaults/main.yml` for all available variables and their default values.

important variables to override in production:

```yaml
# security credentials - use ansible vault for these in production
mysql_root_password: "change_me_in_production"
mysql_replication_password: "change_me_in_production"
# mysql_app_password is automatically generated as a random 32-character string

# performance tuning - adjust based on server resources
mysql_max_connections: 500
mysql_innodb_buffer_pool_size: "1G"  # set to 70-80% of available RAM

# backup settings - adjust based on server resources
mysql_percona_backup_threads: 4      # number of parallel threads for backup
mysql_percona_use_memory: "1G"       # memory allocation for backup process
```

## usage

include this role in your playbook:

```yaml
# For master server
- hosts: mysql_master
  become: true
  vars:
    mysql_server_id: 1
  roles:
    - mysql

# For slave server
- hosts: mysql_slave
  become: true
  vars:
    mysql_server_id: 2
  roles:
    - mysql_slave
```

## replication

this role can be used to set up master-slave replication. the combined setup playbook (`ansible/playbooks/mysql/setup.yml`) configures both master and slave servers in the correct order.

## backup and recovery

the role sets up automated backups using percona xtrabackup with the following schedule:

- full backup on sundays at 3:00 am
- incremental backups on weekdays at 3:00 am
- backup cleanup at 4:00 am daily (removes backups older than `mysql_backup_retention_days`)

backups are stored in `{{ mysql_backup_dir }}` (default: `/var/backups/mysql`).

percona xtrabackup provides several advantages over mysqldump:
- non-blocking backups (no table locks)
- faster backups and restores
- point-in-time recovery
- incremental backup support
- efficient compression and parallel processing

### point-in-time recovery

the role enables binary logging for point-in-time recovery with the following features:
- binary logs stored in `/var/log/mysql/binlogs`
- row-based binary logging format for accurate recovery
- binary log checksums for data integrity
- optimized binary log cache size
- transaction dependency tracking for better performance

a recovery script (`percona_recovery.sh`) is provided to assist with point-in-time recovery operations.

## security

the role implements the following security measures:

- removes anonymous users
- removes remote root access
- removes test database
- sets up a dedicated application user with limited privileges
- configures a separate replication user
- generates a secure random password for the application user

## credentials

the role saves the generated credentials to `~/mysql_app_credentials.txt` on the target server.
this file contains:
- database name (kibamail)
- application username (kibamail)
- generated password

## notes

- this role is designed for ubuntu 24.04 lts
- mysql 8.0.43 is installed from the official mysql apt repository
- percona xtrabackup is installed for efficient, non-blocking backups
- binary logging is enabled for point-in-time recovery
- the role assumes a clean installation (no existing mysql server)
