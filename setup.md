# Setup

1. Must run these commands before booting application:

1. Run the `pnpm cli generate_acme_account_identity` command to generate acme certificates generation account
1. Run the `pnpm cli add_channel` command to add some default channels to community chat.
1. Run the `sudo chown -R 999:999 ./docker/kumomta/spool` command to grant permissions for spool management to the kumod user
1. Install `mkcert` and run `mkcert -install` to install the root certificate authority.
