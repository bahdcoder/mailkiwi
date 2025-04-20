# Setup

1. Must run these commands before booting application:

2. Run the `pnpm cli generate_acme_account_identity` command to generate acme certificates generation account
3. Run the `pnpm cli add_channel` command to add some default channels to community chat.
4. If you are on Ubuntu, Run the `sudo chown -R 999:999 ./docker/kumomta/spool` command to grant permissions for spool management to the kumod user
5. Install `mkcert` and run `mkcert -install` to install the root certificate authority.
6. Run `pnpm playwright install` and `sudo apt-get install libgstreamer-plugins-bad1.0-0 libflite1 libavif16 gstreamer1.0-libav` (ubuntu only) before running playwright tests
