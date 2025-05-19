#!/bin/bash

# Kibamail Server Setup Script
# This script sets up security and best practices for a fresh Ubuntu instance
# It does not install databases or web servers like nginx

set -e

# Log function
log() {
    echo "[INFO] $1"
}

success() {
    echo "[SUCCESS] $1"
}

warn() {
    echo "[WARNING] $1"
}

error() {
    echo "[ERROR] $1"
    exit 1
}

# Print header
echo ""
echo "=== Kibamail Server Setup ==="
echo "Setting up security and best practices for Ubuntu"
echo ""

# 1. Update system packages
log "Updating system packages..."
apt-get update && apt-get upgrade -y
success "System packages updated"

# 2. Install essential packages
log "Installing essential packages..."
apt-get install -y \
    apt-transport-https \
    build-essential \
    ca-certificates \
    curl \
    fail2ban \
    git \
    gnupg \
    htop \
    jq \
    lsb-release \
    net-tools \
    python3 \
    python3-pip \
    software-properties-common \
    sudo \
    tmux \
    tree \
    unattended-upgrades \
    unzip \
    vim \
    wget \
    zip \
    zsh
success "Essential packages installed"

# 3. Configure firewall (UFW)
log "Setting up firewall (UFW)..."
apt-get install -y ufw
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 22/tcp
ufw --force enable
success "Firewall configured and enabled"

# 4. Set up automatic security updates
log "Setting up automatic security updates..."
cat > /etc/apt/apt.conf.d/20auto-upgrades << EOF
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::AutocleanInterval "7";
EOF

cat > /etc/apt/apt.conf.d/50unattended-upgrades << EOF
Unattended-Upgrade::Allowed-Origins {
    "\${distro_id}:\${distro_codename}";
    "\${distro_id}:\${distro_codename}-security";
    "\${distro_id}ESMApps:\${distro_codename}-apps-security";
    "\${distro_id}ESM:\${distro_codename}-infra-security";
};
Unattended-Upgrade::Package-Blacklist {
};
Unattended-Upgrade::AutoFixInterruptedDpkg "true";
Unattended-Upgrade::MinimalSteps "true";
Unattended-Upgrade::InstallOnShutdown "false";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "false";
EOF
success "Automatic security updates configured"

# 5. SSH hardening
log "Hardening SSH configuration..."
sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/#PubkeyAuthentication yes/PubkeyAuthentication yes/' /etc/ssh/sshd_config
sed -i 's/#PermitEmptyPasswords no/PermitEmptyPasswords no/' /etc/ssh/sshd_config
sed -i 's/#ClientAliveInterval 0/ClientAliveInterval 300/' /etc/ssh/sshd_config
sed -i 's/#ClientAliveCountMax 3/ClientAliveCountMax 2/' /etc/ssh/sshd_config
systemctl restart sshd
success "SSH hardened"

# 6. Set up fail2ban
log "Configuring fail2ban..."
cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
EOF
systemctl enable fail2ban
systemctl restart fail2ban
success "fail2ban configured"

# 7. Configure system time and NTP
log "Setting up system time and NTP..."
apt-get install -y chrony
timedatectl set-timezone UTC
systemctl enable chrony
systemctl restart chrony
success "System time and NTP configured"

# 8. Set up log rotation
log "Setting up log rotation..."
cat > /etc/logrotate.d/custom-logs << EOF
/var/log/syslog
/var/log/auth.log
/var/log/kern.log
/var/log/mail.log
{
    rotate 7
    daily
    missingok
    notifempty
    delaycompress
    compress
    postrotate
        /usr/lib/rsyslog/rsyslog-rotate
    endscript
}
EOF
success "Log rotation configured"

# 9. Configure system limits
log "Configuring system limits..."
cat >> /etc/security/limits.conf << EOF
* soft nofile 65536
* hard nofile 65536
* soft nproc 65536
* hard nproc 65536
EOF

cat >> /etc/sysctl.conf << EOF
# Increase system file descriptor limit
fs.file-max = 100000

# Increase TCP max buffer size
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216

# Increase Linux autotuning TCP buffer limits
net.ipv4.tcp_rmem = 4096 87380 16777216
net.ipv4.tcp_wmem = 4096 65536 16777216

# Protect against SYN flood attacks
net.ipv4.tcp_syncookies = 1

# Protect against time-wait assassination
net.ipv4.tcp_rfc1337 = 1

# Decrease swappiness
vm.swappiness = 10

# Increase the maximum amount of memory allocated to shm
kernel.shmmax = 68719476736
EOF
sysctl -p
success "System limits configured"

# 10. Create ansible user (if needed)
log "Creating ansible user..."
if ! id -u ansible > /dev/null 2>&1; then
    useradd -m -s /bin/bash ansible
    mkdir -p /home/ansible/.ssh
    chmod 700 /home/ansible/.ssh
    touch /home/ansible/.ssh/authorized_keys
    chmod 600 /home/ansible/.ssh/authorized_keys
    chown -R ansible:ansible /home/ansible/.ssh
    echo "ansible ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/ansible
    chmod 440 /etc/sudoers.d/ansible

    # Add .bashrc and .profile
    cat > /home/ansible/.bashrc << 'EOF'
[ -z "$PS1" ] && return

HISTCONTROL=ignoredups:ignorespace

shopt -s histappend

HISTSIZE=1000
HISTFILESIZE=2000

shopt -s checkwinsize

[ -x /usr/bin/lesspipe ] && eval "$(SHELL=/bin/sh lesspipe)"

if [ -z "$debian_chroot" ] && [ -r /etc/debian_chroot ]; then
    debian_chroot=$(cat /etc/debian_chroot)
fi

case "$TERM" in
    xterm-color) color_prompt=yes;;
esac

force_color_prompt=yes

if [ -n "$force_color_prompt" ]; then
    if [ -x /usr/bin/tput ] && tput setaf 1 >&/dev/null; then
	# We have color support; assume it's compliant with Ecma-48
	# (ISO/IEC-6429). (Lack of such support is extremely rare, and such
	# a case would tend to support setf rather than setaf.)
	color_prompt=yes
    else
	color_prompt=
    fi
fi

if [ "$color_prompt" = yes ]; then
    PS1='${debian_chroot:+($debian_chroot)}\[\033[01;32m\]\u@\h\[\033[00m\]:\[\033[01;34m\]\w\[\033[00m\]\$ '
else
    PS1='${debian_chroot:+($debian_chroot)}\u@\h:\w\$ '
fi
unset color_prompt force_color_prompt

case "$TERM" in
xterm*|rxvt*)
    PS1="\[\e]0;${debian_chroot:+($debian_chroot)}\u@\h: \w\a\]$PS1"
    ;;
*)
    ;;
esac

if [ -x /usr/bin/dircolors ]; then
    test -r ~/.dircolors && eval "$(dircolors -b ~/.dircolors)" || eval "$(dircolors -b)"
    alias ls='ls --color=auto'
    alias dir='dir --color=auto'
    alias vdir='vdir --color=auto'

    alias grep='grep --color=auto'
    alias fgrep='fgrep --color=auto'
    alias egrep='egrep --color=auto'
fi

alias ll='ls -alF'
alias la='ls -A'
alias l='ls -CF'

if [ -f ~/.bash_aliases ]; then
    . ~/.bash_aliases
fi

if [ -f /etc/bash_completion ] && ! shopt -oq posix; then
   . /etc/bash_completion
fi
EOF

    cat > /home/ansible/.profile << 'EOF'

if [ "$BASH" ]; then
  if [ -f ~/.bashrc ]; then
    . ~/.bashrc
  fi
fi

mesg n 2> /dev/null || true
EOF

    chown ansible:ansible /home/ansible/.bashrc /home/ansible/.profile
    chmod 644 /home/ansible/.bashrc /home/ansible/.profile

    success "Ansible user created"
else
    warn "Ansible user already exists"
fi

# 11. Create semaphore user (if needed)
log "Creating semaphore user..."
if ! id -u semaphore > /dev/null 2>&1; then
    useradd -m -s /bin/bash semaphore
    mkdir -p /home/semaphore/.ssh
    chmod 700 /home/semaphore/.ssh
    touch /home/semaphore/.ssh/authorized_keys
    chmod 600 /home/semaphore/.ssh/authorized_keys
    chown -R semaphore:semaphore /home/semaphore/.ssh
    echo "semaphore ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/semaphore
    chmod 440 /etc/sudoers.d/semaphore

    # Add .bashrc and .profile
    cat > /home/semaphore/.bashrc << 'EOF'
[ -z "$PS1" ] && return

HISTCONTROL=ignoredups:ignorespace

shopt -s histappend

HISTSIZE=1000
HISTFILESIZE=2000

shopt -s checkwinsize

[ -x /usr/bin/lesspipe ] && eval "$(SHELL=/bin/sh lesspipe)"

if [ -z "$debian_chroot" ] && [ -r /etc/debian_chroot ]; then
    debian_chroot=$(cat /etc/debian_chroot)
fi

case "$TERM" in
    xterm-color) color_prompt=yes;;
esac

force_color_prompt=yes

if [ -n "$force_color_prompt" ]; then
    if [ -x /usr/bin/tput ] && tput setaf 1 >&/dev/null; then
	# We have color support; assume it's compliant with Ecma-48
	# (ISO/IEC-6429). (Lack of such support is extremely rare, and such
	# a case would tend to support setf rather than setaf.)
	color_prompt=yes
    else
	color_prompt=
    fi
fi

if [ "$color_prompt" = yes ]; then
    PS1='${debian_chroot:+($debian_chroot)}\[\033[01;32m\]\u@\h\[\033[00m\]:\[\033[01;34m\]\w\[\033[00m\]\$ '
else
    PS1='${debian_chroot:+($debian_chroot)}\u@\h:\w\$ '
fi
unset color_prompt force_color_prompt

case "$TERM" in
xterm*|rxvt*)
    PS1="\[\e]0;${debian_chroot:+($debian_chroot)}\u@\h: \w\a\]$PS1"
    ;;
*)
    ;;
esac

if [ -x /usr/bin/dircolors ]; then
    test -r ~/.dircolors && eval "$(dircolors -b ~/.dircolors)" || eval "$(dircolors -b)"
    alias ls='ls --color=auto'
    alias dir='dir --color=auto'
    alias vdir='vdir --color=auto'

    alias grep='grep --color=auto'
    alias fgrep='fgrep --color=auto'
    alias egrep='egrep --color=auto'
fi

alias ll='ls -alF'
alias la='ls -A'
alias l='ls -CF'

if [ -f ~/.bash_aliases ]; then
    . ~/.bash_aliases
fi

if [ -f /etc/bash_completion ] && ! shopt -oq posix; then
   . /etc/bash_completion
fi
EOF

    cat > /home/semaphore/.profile << 'EOF'

if [ "$BASH" ]; then
  if [ -f ~/.bashrc ]; then
    . ~/.bashrc
  fi
fi

mesg n 2> /dev/null || true
EOF

    chown semaphore:semaphore /home/semaphore/.bashrc /home/semaphore/.profile
    chmod 644 /home/semaphore/.bashrc /home/semaphore/.profile

    success "Semaphore user created"
else
    warn "Semaphore user already exists"
fi

# 12. Set up a more secure umask
log "Setting up secure umask..."
echo "umask 027" >> /etc/profile
echo "umask 027" >> /etc/bash.bashrc
success "Secure umask configured"

# 13. Set up a basic motd
log "Setting up MOTD..."
cat > /etc/update-motd.d/99-custom << EOF
#!/bin/bash
echo ""
echo "Welcome to Kibamail Server"
echo "This server is managed by Ansible - manual changes may be overwritten"
echo ""
echo "System information as of \$(date):"
echo ""
echo "System load: \$(cat /proc/loadavg | awk '{print \$1, \$2, \$3}')"
echo "Memory usage: \$(free -m | awk '/Mem/{printf(\"%3.1f%%\", \$3/\$2*100)}')"
echo "Disk usage: \$(df -h / | awk '/\// {print \$5}')"
echo "Processes: \$(ps aux | wc -l)"
echo ""
EOF
chmod +x /etc/update-motd.d/99-custom
success "MOTD configured"

# Final message
echo ""
echo "=== Server Setup Complete ==="
echo "The server has been configured with security best practices"
echo "Remember to reboot the server to apply all changes"
echo ""