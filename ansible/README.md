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

## roles

- `nodejs`: installs and configures nodejs environment
