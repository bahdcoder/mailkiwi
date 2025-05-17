# kibamail ansible

ansible playbooks for deploying and managing kibamail infrastructure.

## prerequisites

1. python 3.7 or higher
2. ansible 9.0.0 or higher
3. infisical account for secret management

## setup

1. install python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. install ansible collections:
   ```bash
   ansible-galaxy collection install -r collections/requirements.yml
   ```

3. set up infisical integration:
   ```bash
   ./scripts/setup-infisical.sh
   ```

## secret management

this project uses infisical for secret management. secrets are fetched from infisical and stored in a local `vault_secrets.txt` file.

1. set up your infisical token:
   ```bash
   export INFISICAL_TOKEN=st.your-token-here
   ```

2. fetch secrets from infisical:
   ```bash
   ./scripts/setup-infisical.sh staging  # or prod
   ```

3. run playbooks with the fetched secrets:
   ```bash
   ./scripts/run-with-secrets.sh playbooks/app/setup.yml staging  # or prod
   ```

see [INFISICAL.md](INFISICAL.md) for detailed instructions.

## playbooks

- `playbooks/app/setup.yml`: deploys application servers
- `playbooks/mysql/setup.yml`: deploys mysql master and slave servers with replication

## roles

- `nodejs`: installs and configures nodejs environment
- `geerlingguy.mysql`: installs and configures mysql with replication

## mysql setup

to set up mysql with replication:

1. ensure vault_secrets.txt has the required mysql passwords:
   - `MYSQL_ROOT_USER_PASSWORD`: root password for mysql
   - `MYSQL_KIBAMAIL_USER_PASSWORD`: kibamail application user password
   - `MYSQL_REPLICATION_PASSWORD`: replication user password

2. run the mysql setup playbook:
   ```bash
   # For staging environment
   ansible-playbook -i inventory/staging/inventory.yaml playbooks/mysql/setup.yml \
     -e "vault_mysql_root_password=$MYSQL_ROOT_USER_PASSWORD" \
     -e "vault_mysql_kibamail_password=$MYSQL_KIBAMAIL_USER_PASSWORD" \
     -e "vault_mysql_replication_password=$MYSQL_REPLICATION_PASSWORD"

   # For production environment
   ansible-playbook -i inventory/prod/inventory.yaml playbooks/mysql/setup.yml \
     -e "vault_mysql_root_password=$MYSQL_ROOT_USER_PASSWORD" \
     -e "vault_mysql_kibamail_password=$MYSQL_KIBAMAIL_USER_PASSWORD" \
     -e "vault_mysql_replication_password=$MYSQL_REPLICATION_PASSWORD"
   ```

this will:
- install and configure mysql on the master server
- install and configure mysql on the slave server
- set up replication between master and slave
- create the kibamail database with utf8mb4 encoding
- create the kibamail user with access restricted to app servers and localhost

host-specific configurations are stored in the inventory directory:
- `inventory/staging/host_vars/mysql-master.yml`: staging master configuration
- `inventory/staging/host_vars/mysql-slave.yml`: staging slave configuration
- `inventory/prod/host_vars/mysql-master.yml`: production master configuration
- `inventory/prod/host_vars/mysql-slave.yml`: production slave configuration
