FROM ubuntu:24.04

# Set noninteractive frontend to avoid mysql install prompts
ENV DEBIAN_FRONTEND=noninteractive

# Install system packages and MySQL prerequisites
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
  libaio1 \
  libncurses5 \
  && apt clean

# Pre-create /run/mysqld for MySQL installation to work
RUN mkdir -p /run/mysqld && \
    chown mysql:mysql /run/mysqld && \
    chmod 755 /run/mysqld

# Configure SSH server
RUN mkdir -p /run/sshd \
  && echo "PermitRootLogin yes" >> /etc/ssh/sshd_config \
  && echo "PasswordAuthentication no" >> /etc/ssh/sshd_config

# Copy requirements file and install ansible in a virtual env
COPY requirements.txt /tmp/requirements.txt
RUN python3 -m venv /opt/ansible-venv && \
    /opt/ansible-venv/bin/pip install --no-cache-dir -r /tmp/requirements.txt && \
    ln -s /opt/ansible-venv/bin/ansible /usr/local/bin/ansible && \
    ln -s /opt/ansible-venv/bin/ansible-playbook /usr/local/bin/ansible-playbook && \
    ln -s /opt/ansible-venv/bin/ansible-lint /usr/local/bin/ansible-lint

# Add entrypoint
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
