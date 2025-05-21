#!/bin/bash
# Kibamail Coder Development Environment Setup Script
# This script sets up a development environment for Kibamail on Ubuntu

set -e

# Log function for better output
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log "Starting Kibamail Coder environment setup..."

# Get current user (the one who will use the environment)
CURRENT_USER=$(logname || echo $SUDO_USER || echo $USER)
HOME_DIR=$(eval echo ~$CURRENT_USER)

log "Setting up environment for user: $CURRENT_USER (home: $HOME_DIR)"

# Install common development tools and utilities
log "Installing common development tools and utilities..."
apt-get update && apt-get install -y \
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
    zsh \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 22
log "Installing Node.js 22..."
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs
node --version

# Install pnpm v9+
log "Installing pnpm v9+..."
npm install -g pnpm@9

# Install Nginx
log "Installing Nginx..."
apt-get update && apt-get install -y nginx \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install MySQL
log "Installing MySQL..."
# Download and install MySQL APT repository
wget https://dev.mysql.com/get/mysql-apt-config_0.8.24-1_all.deb
DEBIAN_FRONTEND=noninteractive dpkg -i mysql-apt-config_0.8.24-1_all.deb
rm mysql-apt-config_0.8.24-1_all.deb

# Update and install MySQL
apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install -y mysql-server \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Redis
log "Installing Redis..."
apt-get update && apt-get install -y redis-server \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Mailpit
log "Installing Mailpit..."
curl -sL https://raw.githubusercontent.com/axllent/mailpit/develop/install.sh | bash
chmod +x /usr/local/bin/mailpit

# Install KumoMTA (but skip configuration as requested)
log "Installing KumoMTA..."
apt-get update && apt-get install -y curl gnupg ca-certificates
curl -fsSL https://openrepo.kumomta.com/kumomta-debian-12/public.gpg | gpg --yes --dearmor -o /usr/share/keyrings/kumomta.gpg
chmod 644 /usr/share/keyrings/kumomta.gpg
echo "deb [signed-by=/usr/share/keyrings/kumomta.gpg] https://openrepo.kumomta.com/kumomta-debian-12 bookworm main" > /etc/apt/sources.list.d/kumomta.list
apt-get update && apt-get install -y kumomta \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create KumoMTA directories
mkdir -p /opt/kumomta/etc/policy
mkdir -p /var/log/kumomta /var/spool/kumomta
chown -R kumod:kumod /var/log/kumomta /var/spool/kumomta

# Set environment variables for KumoMTA
export API_HTTP_SERVER="http://localhost:5566"
export API_HTTP_ACCESS_TOKEN="development_token"
export TSA_DAEMON_HTTP_SERVER="http://localhost:8008"

# Create MySQL initialization file
log "Creating MySQL initialization file..."
mkdir -p /tmp
cat > /tmp/mysql-init.sql << 'EOF'
-- MySQL initialization for Coder development environment

-- Set root password and allow remote connections
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'password';

-- Create root user for remote connections if it doesn't exist
CREATE USER IF NOT EXISTS 'root'@'%' IDENTIFIED WITH mysql_native_password BY 'password';

-- Create databases
CREATE DATABASE IF NOT EXISTS `kibamail`;
CREATE DATABASE IF NOT EXISTS `kibamail-test`;
CREATE DATABASE IF NOT EXISTS `kibamail-test-playwright`;

-- Grant privileges to root user for all databases
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' WITH GRANT OPTION;
GRANT ALL PRIVILEGES ON `kibamail`.* TO 'root'@'%';
GRANT ALL PRIVILEGES ON `kibamail-test`.* TO 'root'@'%';
GRANT ALL PRIVILEGES ON `kibamail-test-playwright`.* TO 'root'@'%';
FLUSH PRIVILEGES;
EOF

# Initialize MySQL and create databases
log "Initializing MySQL..."
# Start MySQL service
service mysql start

# Set MySQL root password and create databases
mysql < /tmp/mysql-init.sql

# Configure MySQL to allow remote connections
if [ -f /etc/mysql/mysql.conf.d/mysqld.cnf ]; then
    # Ubuntu/Debian style configuration
    sed -i 's/bind-address\s*=\s*127.0.0.1/bind-address = 0.0.0.0/' /etc/mysql/mysql.conf.d/mysqld.cnf
elif [ -f /etc/mysql/my.cnf ]; then
    # Generic MySQL configuration
    if grep -q "bind-address" /etc/mysql/my.cnf; then
        sed -i 's/bind-address\s*=\s*127.0.0.1/bind-address = 0.0.0.0/' /etc/mysql/my.cnf
    else
        echo "[mysqld]" >> /etc/mysql/my.cnf
        echo "bind-address = 0.0.0.0" >> /etc/mysql/my.cnf
    fi
fi

# Restart MySQL to apply changes
service mysql restart

# Configure Redis with custom configuration
log "Configuring Redis..."
cat > /etc/redis/redis.conf << 'EOF'
# Redis configuration for Coder development environment

# Network
bind 0.0.0.0
port 6379
protected-mode no

# General
daemonize no
supervised systemd
pidfile /var/run/redis/redis-server.pid
loglevel notice
logfile /var/log/redis/redis-server.log

# Security
requirepass password

# Memory management
maxmemory 256mb
maxmemory-policy allkeys-lru

# Persistence
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb
aof-load-truncated yes
aof-use-rdb-preamble yes

# Save configuration
save 900 1
save 300 10
save 60 10000

# Client settings
timeout 0
tcp-keepalive 300
databases 16
EOF

# Configure Nginx
log "Configuring Nginx..."
cat > /etc/nginx/nginx.conf << 'EOF'
worker_processes 1;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Simple logging
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    # Development server
    server {
        listen 80;
        server_name _;

        # Health check endpoint
        location /healthz {
            add_header Content-Type text/plain;
            return 200 "OK";
        }

        # Mailpit UI
        location /mailpit/ {
            proxy_pass http://localhost:8025/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }

        # Main application with WebSocket support
        location / {
            proxy_pass http://localhost:5566;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }
    }
}

# Simple mail proxy
stream {
    server {
        listen 25;
        proxy_pass 127.0.0.1:1025;
    }
}
EOF

rm -f /etc/nginx/sites-enabled/default

# Create startup script
log "Creating startup script..."
cat > /usr/local/bin/kibamail-services.sh << 'EOF'
#!/bin/bash
# Start services script for Kibamail development environment

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Start MySQL service
log "Starting MySQL service..."
sudo service mysql start
if [ $? -eq 0 ]; then
  log "MySQL service started successfully"
else
  log "Failed to start MySQL service"
  exit 1
fi

# Start Redis service
log "Starting Redis service..."
sudo service redis-server start
if [ $? -eq 0 ]; then
  log "Redis service started successfully"
else
  # Try alternative method if service command fails
  sudo redis-server /etc/redis/redis.conf &
  if [ $? -eq 0 ]; then
    log "Redis service started successfully using direct command"
  else
    log "Failed to start Redis service"
    exit 1
  fi
fi

# Start Nginx service
log "Starting Nginx service..."
sudo service nginx start
if [ $? -eq 0 ]; then
  log "Nginx service started successfully"
else
  log "Failed to start Nginx service"
  exit 1
fi

# Start Mailpit
log "Starting Mailpit..."
sudo mkdir -p /var/log
sudo nohup mailpit --smtp-bind=0.0.0.0:1025 --ui-bind=0.0.0.0:8025 > /var/log/mailpit.log 2>&1 &
if [ $? -eq 0 ]; then
  log "Mailpit started successfully"
else
  log "Failed to start Mailpit"
  exit 1
fi

log "All services started successfully"
log "You can access:"
log "- Main application: http://localhost"
log "- Mailpit UI: http://localhost/mailpit/"
EOF

chmod +x /usr/local/bin/kibamail-services.sh

# Install zsh-syntax-highlighting
log "Installing zsh-syntax-highlighting..."
echo 'deb http://download.opensuse.org/repositories/shells:/zsh-users:/zsh-syntax-highlighting/xUbuntu_22.04/ /' | tee /etc/apt/sources.list.d/shells:zsh-users:zsh-syntax-highlighting.list
curl -fsSL https://download.opensuse.org/repositories/shells:zsh-users:zsh-syntax-highlighting/xUbuntu_22.04/Release.key | gpg --dearmor | tee /etc/apt/trusted.gpg.d/shells_zsh-users_zsh-syntax-highlighting.gpg > /dev/null
apt-get update
apt-get install -y zsh-syntax-highlighting
rm -rf /var/lib/apt/lists/*

# Set up zsh for current user
log "Setting up zsh for user: $CURRENT_USER..."

# Change shell to zsh for current user
chsh -s /bin/zsh $CURRENT_USER

# Install Oh My Zsh for current user
log "Installing Oh My Zsh for $CURRENT_USER..."
sudo -u $CURRENT_USER sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended

# Install zsh-autosuggestions
log "Installing zsh-autosuggestions..."
sudo -u $CURRENT_USER git clone https://github.com/zsh-users/zsh-autosuggestions ${HOME_DIR}/.oh-my-zsh/custom/plugins/zsh-autosuggestions

# Create .zshrc file for the current user
log "Creating .zshrc file for $CURRENT_USER..."
cat > ${HOME_DIR}/.zshrc << 'EOF'
# Path to your oh-my-zsh installation.
export ZSH=$HOME/.oh-my-zsh

# Set name of the theme to load
ZSH_THEME="robbyrussell"

# Plugins
plugins=(
  git
  zsh-autosuggestions
  zsh-syntax-highlighting
)

# Autosuggest configuration
ZSH_AUTOSUGGEST_HIGHLIGHT_STYLE="fg=#663399,standout"
ZSH_AUTOSUGGEST_BUFFER_MAX_SIZE="20"
ZSH_AUTOSUGGEST_USE_ASYNC=1

# Source oh-my-zsh
source $ZSH/oh-my-zsh.sh

# User configuration
export PATH=$HOME/bin:/usr/local/bin:$PATH

# Preferred editor for local and remote sessions
export EDITOR='vim'

# Aliases
alias ll='ls -la'
alias la='ls -A'
alias l='ls -CF'

# History configuration
HISTSIZE=10000
SAVEHIST=10000
HISTFILE=~/.zsh_history
EOF

# Add zsh-syntax-highlighting to .zshrc
echo "source /usr/share/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh" >> ${HOME_DIR}/.zshrc

# Set proper ownership
chown -R $CURRENT_USER:$CURRENT_USER ${HOME_DIR}/.oh-my-zsh ${HOME_DIR}/.zshrc

log "Setup complete! You can now start the services with sudo /usr/local/bin/kibamail-services.sh"
