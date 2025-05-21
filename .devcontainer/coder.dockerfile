FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:22-bookworm

ARG GIT_USERNAME
ARG CODER_DOMAIN_SUFFIX

# Install common development tools and utilities
RUN apt-get update && apt-get install -y \
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
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 22 (already in base image, but ensure it's the right version)
RUN node --version

# Install pnpm v9+
RUN npm install -g pnpm@9

# Install Nginx
RUN apt-get update && apt-get install -y nginx \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install MySQL
RUN apt-get update && apt-get install -y mysql-server \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Redis
RUN apt-get update && apt-get install -y redis-server \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Mailpit
RUN curl -sL https://raw.githubusercontent.com/axllent/mailpit/develop/install.sh | bash && \
    chmod +x /usr/local/bin/mailpit

# Install KumoMTA
RUN apt-get update && apt-get install -y curl gnupg ca-certificates && \
    curl -fsSL https://openrepo.kumomta.com/kumomta-debian-12/public.gpg | gpg --yes --dearmor -o /usr/share/keyrings/kumomta.gpg && \
    chmod 644 /usr/share/keyrings/kumomta.gpg && \
    echo "deb [signed-by=/usr/share/keyrings/kumomta.gpg] https://openrepo.kumomta.com/kumomta-debian-12 bookworm main" > /etc/apt/sources.list.d/kumomta.list && \
    apt-get update && \
    apt-get install -y kumomta && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Configure KumoMTA
RUN mkdir -p /opt/kumomta/etc/policy

COPY core/kumomta/policy/init.lua /opt/kumomta/etc/policy/init.lua
COPY core/kumomta/policy/tsa_init.lua /opt/kumomta/etc/policy/tsa_init.lua
COPY core/kumomta/policy/responses.toml /opt/kumomta/etc/policy/responses.toml
COPY core/kumomta/policy/extras/shaping.toml /opt/kumomta/etc/policy/extras/shaping.toml
COPY core/kumomta/policy/extras/listener_domains.toml /opt/kumomta/etc/policy/extras/listener_domains.toml

RUN mkdir -p /var/log/kumomta /var/spool/kumomta && \
    chown -R kumod:kumod /var/log/kumomta /var/spool/kumomta

# Set environment variables for KumoMTA
ENV API_HTTP_SERVER="http://localhost:5566" \
    API_HTTP_ACCESS_TOKEN="development_token" \
    TSA_DAEMON_HTTP_SERVER="http://localhost:8008"

# Copy MySQL initialization file
COPY .devcontainer/mysql.init.sql /docker-entrypoint-initdb.d/

# Initialize MySQL and create databases
RUN service mysql start && \
    mysql < /docker-entrypoint-initdb.d/coder-init.sql && \
    sed -i 's/bind-address\s*=\s*127.0.0.1/bind-address = 0.0.0.0/' /etc/mysql/mysql.conf.d/mysqld.cnf

# Configure Redis with custom configuration
COPY .devcontainer/redis.conf /etc/redis/redis.conf

# Configure Nginx
COPY .devcontainer/nginx.conf /etc/nginx/nginx.conf
RUN rm -f /etc/nginx/sites-enabled/default

# Copy and set up scripts
COPY .devcontainer/start-services.sh /usr/local/bin/startup.sh

# Install sudo and additional dependencies
RUN apt-get update \
    && apt-get install -y \
    sudo \
    curl \
    zsh \
    && rm -rf /var/lib/apt/lists/*

# Install Oh My Zsh
RUN sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended

# Install zsh-syntax-highlighting
RUN echo 'deb http://download.opensuse.org/repositories/shells:/zsh-users:/zsh-syntax-highlighting/xUbuntu_22.04/ /' | tee /etc/apt/sources.list.d/shells:zsh-users:zsh-syntax-highlighting.list \
    && curl -fsSL https://download.opensuse.org/repositories/shells:zsh-users:zsh-syntax-highlighting/xUbuntu_22.04/Release.key | gpg --dearmor | tee /etc/apt/trusted.gpg.d/shells_zsh-users_zsh-syntax-highlighting.gpg > /dev/null \
    && apt-get update \
    && apt-get install -y zsh-syntax-highlighting \
    && rm -rf /var/lib/apt/lists/*

# Install zsh-autosuggestions
RUN git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-/root/.oh-my-zsh/custom}/plugins/zsh-autosuggestions

# Create non-root user with sudo privileges
ARG USER=coder
RUN useradd --groups sudo --no-create-home --shell /bin/zsh ${USER} \
    && echo "${USER} ALL=(ALL) NOPASSWD:ALL" >/etc/sudoers.d/${USER} \
    && chmod 0440 /etc/sudoers.d/${USER} \
    && mkdir -p /home/${USER} \
    && chown -R ${USER}:${USER} /home/${USER}

# Set up Oh My Zsh for the coder user
COPY .devcontainer/.zshrc /home/${USER}/.zshrc
RUN mkdir -p /home/${USER}/.oh-my-zsh/custom/plugins \
    && cp -r /root/.oh-my-zsh /home/${USER}/ \
    && cp -r ${ZSH_CUSTOM:-/root/.oh-my-zsh/custom}/plugins/zsh-autosuggestions /home/${USER}/.oh-my-zsh/custom/plugins/ \
    && echo "source /usr/share/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh" >> /home/${USER}/.zshrc \
    && chown -R ${USER}:${USER} /home/${USER}/.oh-my-zsh /home/${USER}/.zshrc

# Switch to non-root user
USER ${USER}
WORKDIR /home/${USER}

# Set the entrypoint to our startup script
ENTRYPOINT ["/usr/local/bin/startup.sh"]
CMD ["sleep", "infinity"]
