#!/bin/bash
# Start services script for Kibamail Coder development environment

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log "starting mysql service..."
sudo service mysql start
if [ $? -eq 0 ]; then
  log "mysql service started successfully"
else
  log "Failed to start mysql service"
  exit 1
fi

log "starting redis service..."
sudo redis-server /etc/redis/redis.conf
if [ $? -eq 0 ]; then
  log "redis service started successfully"
else
  log "Failed to start redis service"
  exit 1
fi

log "starting nginx service..."
sudo service nginx start
if [ $? -eq 0 ]; then
  log "nginx service started successfully"
else
  log "failed to start nginx service"
  exit 1
fi

log "starting kumomta service..."
sudo service kumomta start
if [ $? -eq 0 ]; then
  log "kumomta service started successfully"
else
  log "failed to start kumomta service"
  exit 1
fi

log "starting kumomta tsa daemon..."
sudo service kumo-tsa-daemon start
if [ $? -eq 0 ]; then
  log "kumomta tsa daemon started successfully"
else
  log "Failed to start kumomta tsa daemon"
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

exec "$@"
