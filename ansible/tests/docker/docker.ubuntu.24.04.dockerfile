FROM ubuntu:24.04

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
  && apt clean \
  && mkdir -p /run/sshd \
  && echo "PermitRootLogin yes" >> /etc/ssh/sshd_config \
  && echo "PasswordAuthentication no" >> /etc/ssh/sshd_config \
  && service ssh start

# Add entrypoint script to start SSH server
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
