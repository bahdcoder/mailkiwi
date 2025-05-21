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

stage_log "INSTALLING WEB SERVER"
log "installing nginx..."
apt install -y nginx

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
cat > /etc/redis/redis.conf << 'EOF'
bind 0.0.0.0
port 6379
protected-mode no
daemonize no
supervised systemd
pidfile /var/run/redis/redis-server.pid
loglevel notice
logfile /var/log/redis/redis-server.log
requirepass password
maxmemory 256mb
maxmemory-policy allkeys-lru
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb
aof-load-truncated yes
aof-use-rdb-preamble yes
save 900 1
save 300 10
save 60 10000
timeout 0
tcp-keepalive 300
databases 16
EOF

stage_log "CONFIGURING WEB SERVER"
log "configuring nginx..."
cat > /etc/nginx/nginx.conf << 'EOF'
worker_processes 1;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    server {
        listen 80;
        server_name _;

        location /healthz {
            add_header Content-Type text/plain;
            return 200 "OK";
        }

        location /mailpit/ {
            proxy_pass http://localhost:8025/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }

        location / {
            proxy_pass http://localhost:5566;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }
    }
}

stream {
    server {
        listen 25;
        proxy_pass 127.0.0.1:1025;
    }
}
EOF

rm -f /etc/nginx/sites-enabled/default

stage_log "CREATING SERVICE MANAGEMENT SCRIPT"
log "creating startup script..."
cat > /usr/local/bin/kibamail-services.sh << 'EOF'
#!/bin/bash

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log "starting mysql service..."
sudo service mysql start
if [ $? -eq 0 ]; then
  log "mysql service started successfully"
else
  log "failed to start mysql service"
  exit 1
fi

log "starting redis service..."
sudo service redis-server start
if [ $? -eq 0 ]; then
  log "redis service started successfully"
else
  sudo redis-server /etc/redis/redis.conf &
  if [ $? -eq 0 ]; then
    log "redis service started successfully using direct command"
  else
    log "failed to start redis service"
    exit 1
  fi
fi

log "starting nginx service..."
sudo service nginx start
if [ $? -eq 0 ]; then
  log "nginx service started successfully"
else
  log "failed to start nginx service"
  exit 1
fi

log "starting mailpit..."
sudo mkdir -p /var/log
sudo nohup mailpit --smtp-bind=0.0.0.0:1025 --ui-bind=0.0.0.0:8025 > /var/log/mailpit.log 2>&1 &
if [ $? -eq 0 ]; then
  log "mailpit started successfully"
else
  log "failed to start mailpit"
  exit 1
fi

log "all services started successfully"
log "you can access:"
log "- main application: http://localhost"
log "- mailpit ui: http://localhost/mailpit/"
EOF

chmod +x /usr/local/bin/kibamail-services.sh

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

log "setup complete! you can now start the services with sudo /usr/local/bin/kibamail-services.sh"

stage_log "INSTALLATION COMPLETE"
echo "Kibamail development environment has been successfully set up!"
echo "Run 'sudo /usr/local/bin/kibamail-services.sh' to start all services"
