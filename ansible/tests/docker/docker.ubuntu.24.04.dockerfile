FROM ubuntu:24.04

# Install system packages
RUN apt update && apt install -y \
  openssh-client \
  openssh-server \
  curl \
  wget \
  rsync \
  gnupg \
  iputils-ping \
  net-tools \
  lsb-release \
  software-properties-common \
  ca-certificates \
  unzip \
  sudo \
  python3 \
  python3-pip \
  python3-venv \
  python3-full \
  && apt clean

# Configure SSH server
RUN mkdir -p /run/sshd \
  && echo "PermitRootLogin yes" >> /etc/ssh/sshd_config \
  && echo "PasswordAuthentication no" >> /etc/ssh/sshd_config

# Copy requirements file
COPY ../../requirements.txt /tmp/requirements.txt

# Install Ansible and dependencies using a virtual environment
RUN python3 -m venv /opt/ansible-venv && \
    /opt/ansible-venv/bin/pip install --no-cache-dir -r /tmp/requirements.txt && \
    ln -s /opt/ansible-venv/bin/ansible /usr/local/bin/ansible && \
    ln -s /opt/ansible-venv/bin/ansible-playbook /usr/local/bin/ansible-playbook && \
    ln -s /opt/ansible-venv/bin/ansible-lint /usr/local/bin/ansible-lint

# Add entrypoint script to start SSH server
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
