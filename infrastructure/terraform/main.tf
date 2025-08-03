terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
  
  backend "remote" {
    organization = "coalesce-labs"
    
    workspaces {
      name = "npflared"
    }
  }
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

variable "cloudflare_api_token" {
  description = "Cloudflare API Token"
  type        = string
  sensitive   = true
}

variable "cloudflare_account_id" {
  description = "Cloudflare Account ID"
  type        = string
}

variable "cloudflare_zone_id" {
  description = "Cloudflare Zone ID for coalescelabs.ai"
  type        = string
}

variable "environment" {
  description = "Environment name (staging or production)"
  type        = string
  default     = "production"
}

# R2 Bucket for package storage
resource "cloudflare_r2_bucket" "npm_packages" {
  account_id = var.cloudflare_account_id
  name       = var.environment == "production" ? "coalesce-labs-npm-repository" : "coalesce-labs-npm-repository-${var.environment}"
  location   = "auto"
}

# D1 Database for metadata
resource "cloudflare_d1_database" "npm_registry" {
  account_id = var.cloudflare_account_id
  name       = var.environment == "production" ? "npflared-db" : "npflared-db-${var.environment}"
}

# DNS Record for custom domain (production only)
resource "cloudflare_record" "npm_subdomain" {
  count   = var.environment == "production" ? 1 : 0
  zone_id = var.cloudflare_zone_id
  name    = "npm"
  value   = "npm.coalescelabs.ai.cdn.cloudflare.net"
  type    = "CNAME"
  proxied = true
}

# Output values for use in CI/CD
output "r2_bucket_name" {
  value = cloudflare_r2_bucket.npm_packages.name
}

output "d1_database_id" {
  value = cloudflare_d1_database.npm_registry.id
}

output "d1_database_name" {
  value = cloudflare_d1_database.npm_registry.name
}