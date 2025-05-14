#!/bin/bash

set -eo pipefail

if [ ! -f tests/.ssh/kibamail-test ]; then
    echo "ssh key not found. please run generate_ssh_key.sh first."
    exit 1
fi

if ! docker ps | grep -q "root"; then
    echo "containers not running. starting docker compose..."
    docker-compose -f tests/docker/docker-compose.yml up --wait
fi


PUB_KEY=$(cat tests/.ssh/kibamail-test.pub)

docker exec ansible-root mkdir -p /root/.ssh

docker cp tests/.ssh/kibamail-test ansible-root:/root/.ssh/id_ed25519
docker exec ansible-root chmod 600 /root/.ssh/id_ed25519

docker exec ansible-root bash -c 'echo -e "Host *\n  IdentityFile ~/.ssh/id_ed25519\n  StrictHostKeyChecking no" > /root/.ssh/config'
docker exec ansible-root chmod 600 /root/.ssh/config

CONTAINERS=("ansible-app-1" "ansible-app-2" "ansible-dragonfly" "ansible-mail-1" "ansible-mail-2" "ansible-mail-proxy" "ansible-mysql-master" "ansible-mysql-slave" "ansible-monitoring")

for CONTAINER in "${CONTAINERS[@]}"; do
    echo "setting up ssh keys for $CONTAINER..."

    docker exec $CONTAINER mkdir -p /root/.ssh

    docker exec $CONTAINER bash -c "echo '$PUB_KEY' >> /root/.ssh/authorized_keys"

    docker exec $CONTAINER chmod 700 /root/.ssh
    docker exec $CONTAINER chmod 600 /root/.ssh/authorized_keys

    docker exec ansible-root bash -c "ssh-keyscan -H $CONTAINER >> /root/.ssh/known_hosts"
    
    echo "ssh key setup completed for $CONTAINER"
done

echo "setting up hosts file in root container..."
docker exec ansible-root bash -c "echo '10.0.0.2 app-1' >> /etc/hosts"
docker exec ansible-root bash -c "echo '10.0.0.11 app-2' >> /etc/hosts"
docker exec ansible-root bash -c "echo '10.0.0.3 dragonfly' >> /etc/hosts"
docker exec ansible-root bash -c "echo '10.0.0.4 mail-1' >> /etc/hosts"
docker exec ansible-root bash -c "echo '10.0.0.10 mail-2' >> /etc/hosts"
docker exec ansible-root bash -c "echo '10.0.0.6 mail-proxy' >> /etc/hosts"
docker exec ansible-root bash -c "echo '10.0.0.7 mysql-master' >> /etc/hosts"
docker exec ansible-root bash -c "echo '10.0.0.8 mysql-slave' >> /etc/hosts"
docker exec ansible-root bash -c "echo '10.0.0.5 monitoring' >> /etc/hosts"

echo "testing ssh connections from root container..."
for CONTAINER in "${CONTAINERS[@]}"; do
    docker exec ansible-root ssh root@$CONTAINER "echo 'ssh connection to $CONTAINER successful!'"
done

echo "ssh setup completed successfully!"
