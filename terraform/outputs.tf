output "app_servers" {
  value = {
    for idx, server in hcloud_server.app : server.name => {
      id         = server.id
      private_ip = lookup(var.server_ips, server.name)
    }
  }
}

output "redis_server" {
  value = {
    id         = hcloud_server.redis.id
    name       = hcloud_server.redis.name
    private_ip = lookup(var.server_ips, hcloud_server.redis.name)
  }
}

output "mail_servers" {
  value = {
    for idx, server in hcloud_server.mail : server.name => {
      id         = server.id
      private_ip = lookup(var.server_ips, server.name)
    }
  }
}

output "mail_proxy_server" {
  value = {
    id         = hcloud_server.mail_proxy.id
    name       = hcloud_server.mail_proxy.name
    private_ip = lookup(var.server_ips, hcloud_server.mail_proxy.name)
  }
}

output "mysql_master_server" {
  value = {
    id         = hcloud_server.mysql_master.id
    name       = hcloud_server.mysql_master.name
    private_ip = lookup(var.server_ips, hcloud_server.mysql_master.name)
  }
}

output "mysql_slave_server" {
  value = {
    id         = hcloud_server.mysql_slave.id
    name       = hcloud_server.mysql_slave.name
    private_ip = lookup(var.server_ips, hcloud_server.mysql_slave.name)
  }
}

output "monitoring_server" {
  value = {
    id         = hcloud_server.monitoring.id
    name       = hcloud_server.monitoring.name
    private_ip = lookup(var.server_ips, hcloud_server.monitoring.name)
  }
}



output "network" {
  value = {
    id       = hcloud_network.kibamail_network.id
    name     = hcloud_network.kibamail_network.name
    ip_range = hcloud_network.kibamail_network.ip_range
  }
}

output "ansible_inventory" {
  value = <<-EOT
    app:
      hosts:
        app-1:
          ansible_host: ${lookup(var.server_ips, "app-1")}
        app-2:
          ansible_host: ${lookup(var.server_ips, "app-2")}

    redis:
      hosts:
        redis:
          ansible_host: ${lookup(var.server_ips, "redis")}

    mail:
      hosts:
        mail-1:
          ansible_host: ${lookup(var.server_ips, "mail-1")}
        mail-2:
          ansible_host: ${lookup(var.server_ips, "mail-2")}

    mail_proxy:
      hosts:
        mail-proxy:
          ansible_host: ${lookup(var.server_ips, "mail-proxy")}

    mysql_master:
      hosts:
        mysql-master:
          ansible_host: ${lookup(var.server_ips, "mysql-master")}

    mysql_slave:
      hosts:
        mysql-slave:
          ansible_host: ${lookup(var.server_ips, "mysql-slave")}

    monitoring:
      hosts:
        monitoring:
          ansible_host: ${lookup(var.server_ips, "monitoring")}

    mysql:
      children:
        mysql_master:
        mysql_slave:

    staging:
      children:
        app:
        redis:
        mail:
        mail_proxy:
        mysql:
        monitoring:
  EOT
}
