#!/bin/bash

set -e 

if [ -f tests/.ssh/kibamail-test ]; then
    echo "ssh key already generated. existing..."
    exit 0
fi

ssh-keygen -t ed25519 -C "engineering@kibamail.com" -f tests/.ssh/kibamail-test -N ""

echo "ssh key generated and saved in tests/.ssh/kibamai-test"
echo "public key saved in tests/.ssh/kibamai-test.pub"
