#!/bin/bash

# Start SSH server
/usr/sbin/sshd

# Execute the original command
exec "$@"
