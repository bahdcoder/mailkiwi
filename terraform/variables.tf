variable "hcloud_token" {
  type        = string
  sensitive   = true
}

variable "location" {
  type        = string
  default     = "fsn1"
}

variable "ssh_key_name" {
  type        = string
  default     = "kibamail-staging"
}

variable "server_type" {
  type        = string
  default     = "cpx21"
}

variable "image" {
  type        = string
  default     = "ubuntu-24.04"
}

variable "network_name" {
  type        = string
  default     = "kibamail-staging-network"
}

variable "subnet_name" {
  type        = string
  default     = "kibamail-staging-network-subnett"
}

variable "network_ip_range" {
  type        = string
  default     = "172.16.0.0/16"
}

variable "environment" {
  type        = string
  default     = "staging"
}

variable "labels" {
  type        = map(string)
  default     = {
    "project"    = "kibamail"
    "environment" = "staging"
  }
}

variable "server_ips" {
  type        = map(string)
  default     = {
    "app-1"        = "172.16.0.3"
    "app-2"        = "172.16.0.2"
    "redis"        = "172.16.0.11"
    "mail-1"       = "172.16.0.10"
    "mail-2"       = "172.16.0.5"
    "mail-proxy"   = "172.16.0.6"
    "mysql-master" = "172.16.0.13"
    "mysql-slave"  = "172.16.0.8"
    "monitoring"   = "172.16.0.4"
  }
}
