FROM ubuntu:24.04

RUN apt update && apt install -y \
  openssh-client \
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
  && apt clean
