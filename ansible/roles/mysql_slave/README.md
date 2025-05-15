# mysql_slave role

this role configures a mysql server as a slave/replica in a master-slave replication setup.

## features

- extends the base mysql role with slave-specific configuration
- automatically configures replication from the master
- sets up read-only mode for the slave
- configures parallel replication for improved performance
- handles replication errors gracefully
- inherits the kibamail database and user from the master

## variables

see `defaults/main.yml` for all available variables and their default values.

important variables to override in production:

```yaml
# replication settings
mysql_server_id: 2  # must be unique for each slave
mysql_master_host: "master.example.com"  # master hostname or IP
mysql_replica_parallel_workers: 4  # adjust based on server resources
```

## usage

this role is included in the combined setup playbook (`ansible/playbooks/mysql/setup.yml`) which configures both master and slave servers in the correct order:

```yaml
# Combined setup playbook
- name: setup mysql master server
  hosts: mysql_master
  become: true
  vars:
    mysql_server_id: 1
  roles:
    - mysql

- name: setup mysql slave server
  hosts: mysql_slave
  become: true
  vars:
    mysql_server_id: 2
  roles:
    - mysql_slave
```

## dependencies

this role depends on the `mysql` role and will include it automatically.

## notes

- this role assumes the master is already set up and accessible
- the role will automatically fetch replication coordinates from the master
- gtid-based replication is used for improved reliability
- the slave is configured in read-only mode by default
- the kibamail database and user are replicated from the master
