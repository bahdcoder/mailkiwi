#!/bin/bash
set -e

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

stage_log() {
  echo ""
  echo "--------------------------------------------"
  echo "$1"
  echo "--------------------------------------------"
  echo ""
}

stage_log "STARTING KIBAMAIL CODER ENVIRONMENT SETUP"

CURRENT_USER=$(logname || echo $SUDO_USER || echo $USER)
HOME_DIR=$(eval echo ~$CURRENT_USER)

log "setting up environment for user: $CURRENT_USER (home: $HOME_DIR)"

stage_log "INSTALLING COMMON DEVELOPMENT TOOLS"
apt update && apt install -y \
    gzip \
    git \
    curl \
    wget \
    vim \
    htop \
    zip \
    unzip \
    gnupg2 \
    lsb-release \
    apt-transport-https \
    ca-certificates \
    software-properties-common \
    build-essential \
    python3 \
    g++ \
    make \
    sudo \
    zsh

stage_log "INSTALLING NODE.JS AND PNPM"
log "installing node.js 22..."
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs
node --version

log "installing pnpm v9+..."
npm install -g pnpm@9

log "installing pm2 globally..."
npm install -g pm2

stage_log "INSTALLING DATABASE"
log "installing mysql..."

log "adding mysql gpg key..."
sudo gpg --keyserver keyserver.ubuntu.com --recv B7B3B788A8D3785C
sudo gpg --export --armor B7B3B788A8D3785C | sudo apt-key add -

apt update
DEBIAN_FRONTEND=noninteractive apt install -y mysql-server

stage_log "INSTALLING CACHE SERVER"
log "installing redis..."
apt install -y redis-server

stage_log "INSTALLING MAIL TESTING TOOLS"
log "installing mailpit..."
curl -sL https://raw.githubusercontent.com/axllent/mailpit/develop/install.sh | bash
chmod +x /usr/local/bin/mailpit

stage_log "CONFIGURING DATABASE"
log "creating mysql initialization file..."
mkdir -p /tmp
cat > /tmp/mysql-init.sql << 'EOF'
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'password';
CREATE USER IF NOT EXISTS 'root'@'%' IDENTIFIED WITH mysql_native_password BY 'password';
CREATE DATABASE IF NOT EXISTS `kibamail`;
CREATE DATABASE IF NOT EXISTS `kibamail-test`;
CREATE DATABASE IF NOT EXISTS `kibamail-test-playwright`;
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' WITH GRANT OPTION;
GRANT ALL PRIVILEGES ON `kibamail`.* TO 'root'@'%';
GRANT ALL PRIVILEGES ON `kibamail-test`.* TO 'root'@'%';
GRANT ALL PRIVILEGES ON `kibamail-test-playwright`.* TO 'root'@'%';
FLUSH PRIVILEGES;
EOF

log "initializing mysql..."
service mysql start
mysql < /tmp/mysql-init.sql

if [ -f /etc/mysql/mysql.conf.d/mysqld.cnf ]; then
    sed -i 's/bind-address\s*=\s*127.0.0.1/bind-address = 0.0.0.0/' /etc/mysql/mysql.conf.d/mysqld.cnf
elif [ -f /etc/mysql/my.cnf ]; then
    if grep -q "bind-address" /etc/mysql/my.cnf; then
        sed -i 's/bind-address\s*=\s*127.0.0.1/bind-address = 0.0.0.0/' /etc/mysql/my.cnf
    else
        echo "[mysqld]" >> /etc/mysql/my.cnf
        echo "bind-address = 0.0.0.0" >> /etc/mysql/my.cnf
    fi
fi

service mysql restart

stage_log "CONFIGURING CACHE SERVER"
log "configuring redis..."

log "setting up redis log directory..."
mkdir -p /var/log/redis
chmod 755 /var/log/redis
touch /var/log/redis/redis-server.log
chmod 664 /var/log/redis/redis-server.log
chown -R redis:redis /var/log/redis

usermod -a -G redis $CURRENT_USER

log "setting up redis data directories..."
mkdir -p /var/lib/redis
chown -R redis:redis /var/lib/redis
chmod -R 770 /var/lib/redis
chmod -R g+rwx /var/lib/redis

log "setting up redis run directory..."
mkdir -p /var/run/redis
chown redis:redis /var/run/redis
chmod 770 /var/run/redis

cat > /etc/redis/redis.conf << 'EOF'
bind 0.0.0.0
port 6379
protected-mode no
daemonize yes
supervised systemd
pidfile /var/run/redis/redis-server.pid
loglevel notice
logfile /var/log/redis/redis-server.log
requirepass password
maxmemory 512mb
maxmemory-policy noeviction
appendonly no
save ""
timeout 0
tcp-keepalive 300
databases 16
EOF

# Set vm.overcommit_memory to 1 as recommended by Redis
log "setting vm.overcommit_memory to 1..."
sysctl vm.overcommit_memory=1
echo "vm.overcommit_memory = 1" >> /etc/sysctl.conf

# Restart Redis to apply configuration
log "restarting redis service..."
service redis-server restart

stage_log "SETTING UP ZSH ENVIRONMENT"

log "setting up zsh for user: $CURRENT_USER..."
chsh -s /bin/zsh $CURRENT_USER

log "creating .zshrc file for $CURRENT_USER..."
cat > ${HOME_DIR}/.zshrc << 'EOF'
export ZSH=$HOME/.oh-my-zsh
ZSH_THEME="robbyrussell"

plugins=(
  git
)

source $ZSH/oh-my-zsh.sh

export PATH=$HOME/bin:/usr/local/bin:$PATH
export EDITOR='vim'
EOF

stage_log "STARTING SERVICES"

log "starting mysql service..."
service mysql restart
log "mysql service started successfully"

log "starting redis service..."
service redis-server restart
log "redis service started successfully"

log "starting mailpit..."
mkdir -p /var/log
nohup mailpit --smtp-bind=0.0.0.0:1025 --ui-bind=0.0.0.0:8025 > /var/log/mailpit.log 2>&1 &
log "mailpit started successfully"

log "all services started successfully"

stage_log "INSTALLATION COMPLETE"
echo "kibamail development environment has been successfully set up!"
echo "all services have been started automatically"
echo "mailpit ui is available at: http://localhost:8025"
