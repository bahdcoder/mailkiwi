data "hcloud_ssh_key" "terraform" {
  name = var.ssh_key_name
}

resource "hcloud_network" "kibamail_network" {
  name     = var.network_name
  ip_range = var.network_ip_range
  delete_protection = true
}

resource "hcloud_network_subnet" "kibamail_subnet" {
  network_id   = hcloud_network.kibamail_network.id
  type         = "cloud"
  network_zone = "eu-central"
  ip_range     = var.network_ip_range
}

resource "hcloud_server" "app" {
  count       = 2
  name        = "app-${count.index + 1}"
  server_type = var.server_type
  image       = var.image
  location    = var.location
  ssh_keys    = [data.hcloud_ssh_key.terraform.id]
  labels      = merge(var.labels, { "role" = "app" })
  user_data   = file("${path.module}/user-data.sh")
  delete_protection = true
  rebuild_protection = true
  depends_on = [hcloud_network_subnet.kibamail_subnet]

  public_net {
    ipv4_enabled = false
    ipv6_enabled = false
  }

  network {
    network_id = hcloud_network.kibamail_network.id
    ip         = lookup(var.server_ips, "app-${count.index + 1}")
  }
}

resource "hcloud_server" "redis" {
  name        = "redis"
  server_type = var.server_type
  image       = var.image
  location    = var.location
  ssh_keys    = [data.hcloud_ssh_key.terraform.id]
  labels      = merge(var.labels, { "role" = "redis" })
  user_data   = file("${path.module}/user-data.sh")
  delete_protection = true
  rebuild_protection = true
  depends_on = [hcloud_network_subnet.kibamail_subnet]

  public_net {
    ipv4_enabled = false
    ipv6_enabled = false
  }

  network {
    network_id = hcloud_network.kibamail_network.id
    ip         = lookup(var.server_ips, "redis")
  }
}

resource "hcloud_server" "mail" {
  count       = 2
  name        = "mail-${count.index + 1}"
  server_type = var.server_type
  image       = var.image
  location    = var.location
  ssh_keys    = [data.hcloud_ssh_key.terraform.id]
  labels      = merge(var.labels, { "role" = "mail" })
  user_data   = file("${path.module}/user-data.sh")
  delete_protection = true
  rebuild_protection = true
  depends_on = [hcloud_network_subnet.kibamail_subnet]

  public_net {
    ipv4_enabled = false
    ipv6_enabled = false
  }

  network {
    network_id = hcloud_network.kibamail_network.id
    ip         = lookup(var.server_ips, "mail-${count.index + 1}")
  }
}

resource "hcloud_server" "mail_proxy" {
  name        = "mail-proxy"
  server_type = var.server_type
  image       = var.image
  location    = var.location
  ssh_keys    = [data.hcloud_ssh_key.terraform.id]
  labels      = merge(var.labels, { "role" = "mail-proxy" })
  user_data   = file("${path.module}/user-data.sh")
  delete_protection = true
  rebuild_protection = true
  depends_on = [hcloud_network_subnet.kibamail_subnet]

  public_net {
    ipv4_enabled = false
    ipv6_enabled = false
  }

  network {
    network_id = hcloud_network.kibamail_network.id
    ip         = lookup(var.server_ips, "mail-proxy")
  }
}

resource "hcloud_server" "mysql_master" {
  name        = "mysql-master"
  server_type = var.server_type
  image       = var.image
  location    = var.location
  ssh_keys    = [data.hcloud_ssh_key.terraform.id]
  labels      = merge(var.labels, { "role" = "mysql", "type" = "master" })
  user_data   = file("${path.module}/user-data.sh")
  delete_protection = true
  rebuild_protection = true
  depends_on = [hcloud_network_subnet.kibamail_subnet]

  public_net {
    ipv4_enabled = false
    ipv6_enabled = false
  }

  network {
    network_id = hcloud_network.kibamail_network.id
    ip         = lookup(var.server_ips, "mysql-master")
  }
}

resource "hcloud_server" "mysql_slave" {
  name        = "mysql-slave"
  server_type = var.server_type
  image       = var.image
  location    = var.location
  ssh_keys    = [data.hcloud_ssh_key.terraform.id]
  labels      = merge(var.labels, { "role" = "mysql", "type" = "slave" })
  user_data   = file("${path.module}/user-data.sh")
  delete_protection = true
  rebuild_protection = true
  depends_on = [hcloud_network_subnet.kibamail_subnet]

  public_net {
    ipv4_enabled = false
    ipv6_enabled = false
  }

  network {
    network_id = hcloud_network.kibamail_network.id
    ip         = lookup(var.server_ips, "mysql-slave")
  }
}

resource "hcloud_server" "monitoring" {
  name        = "monitoring"
  server_type = var.server_type
  image       = var.image
  location    = var.location
  ssh_keys    = [data.hcloud_ssh_key.terraform.id]
  labels      = merge(var.labels, { "role" = "monitoring" })
  user_data   = file("${path.module}/user-data.sh")
  delete_protection = true
  rebuild_protection = true
  depends_on = [hcloud_network_subnet.kibamail_subnet]

  public_net {
    ipv4_enabled = false
    ipv6_enabled = false
  }

  network {
    network_id = hcloud_network.kibamail_network.id
    ip         = lookup(var.server_ips, "monitoring")
  }
}


