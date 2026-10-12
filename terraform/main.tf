# Terraform Infrastructure as Code for get-now Open Library
# Provisions AWS S3/Cloudflare R2, PostgreSQL, Redis, and Cloudflare CDN

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

variable "environment" {
  type    = string
  default = "production"
}

variable "cloudflare_account_id" {
  type        = string
  description = "Cloudflare Account ID for R2 storage"
  default     = "getnow_cloudflare_account"
}

# 1. Cloudflare R2 Media Storage Bucket
resource "cloudflare_r2_bucket" "media_archive" {
  account_id = var.cloudflare_account_id
  name       = "getnow-open-archive-${var.environment}"
  location   = "WNAM"
}

# 2. Managed PostgreSQL Database (Amazon RDS Aurora Serverless v2 or Neon)
resource "aws_db_instance" "postgres_db" {
  allocated_storage       = 100
  max_allocated_storage   = 1000
  engine                  = "postgres"
  engine_version          = "16.1"
  instance_class          = "db.t4g.medium"
  db_name                 = "getnow_library_${var.environment}"
  username                = "getnow_admin"
  manage_master_user_password = true
  publicly_accessible    = false
  skip_final_snapshot     = false
  backup_retention_period = 30
  storage_encrypted       = true
  deletion_protection     = true

  tags = {
    Project     = "get-now Open Library"
    Environment = var.environment
  }
}

# 3. Managed Redis ElastiCache for Queue and Session Caching
resource "aws_elasticache_cluster" "redis_cluster" {
  cluster_id           = "getnow-redis-${var.environment}"
  engine               = "redis"
  node_type            = "cache.t4g.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379

  tags = {
    Project     = "get-now Open Library"
    Environment = var.environment
  }
}

output "database_endpoint" {
  value       = aws_db_instance.postgres_db.endpoint
  description = "Primary PostgreSQL connection string endpoint"
}

output "r2_bucket_name" {
  value       = cloudflare_r2_bucket.media_archive.name
  description = "Cloudflare R2 Bucket for EPUB, PDF, and CBZ assets"
}
