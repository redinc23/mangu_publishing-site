variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "mangu-publishing"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "Allocated storage for RDS in GB"
  type        = number
  default     = 20
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "mangu_production"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
}

variable "redis_node_type" {
  description = "ElastiCache node type"
  type        = string
  default     = "cache.t3.micro"
}

variable "redis_num_cache_nodes" {
  description = "Number of cache nodes"
  type        = number
  default     = 1
}

variable "ecs_server_cpu" {
  description = "CPU units for server task"
  type        = number
  default     = 512
}

variable "ecs_server_memory" {
  description = "Memory for server task in MB"
  type        = number
  default     = 1024
}

variable "ecs_client_cpu" {
  description = "CPU units for client task"
  type        = number
  default     = 256
}

variable "ecs_client_memory" {
  description = "Memory for client task in MB"
  type        = number
  default     = 512
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = "mangu-publishing.com"
}

variable "certificate_arn" {
  description = "ARN of ACM certificate"
  type        = string
  default     = ""
}

variable "image_tag" {
  description = "Docker image tag to deploy"
  type        = string
  default     = "latest"
}

variable "budget_alert_emails" {
  description = "Email addresses to receive budget and cost anomaly alerts"
  type        = list(string)
  default     = []
}

variable "enable_geo_blocking" {
  description = "Enable geo-blocking in WAF"
  type        = bool
  default     = false
}

variable "blocked_countries" {
  description = "List of country codes to block (ISO 3166-1 alpha-2)"
  type        = list(string)
  default     = []
}

variable "enable_origin_shield" {
  description = "Enable CloudFront Origin Shield for additional caching layer"
  type        = bool
  default     = false
}

variable "origin_verify_secret" {
  description = "Secret header value for origin verification"
  type        = string
  sensitive   = true
  default     = ""
}

variable "monthly_budget_limit" {
  description = "Total monthly budget limit in USD"
  type        = number
  default     = 1000
}

variable "ecs_budget_limit" {
  description = "ECS service budget limit in USD"
  type        = number
  default     = 400
}

variable "rds_budget_limit" {
  description = "RDS service budget limit in USD"
  type        = number
  default     = 300
}

variable "anomaly_impact_threshold" {
  description = "Percentage impact threshold for anomaly detection (dollars)"
  type        = number
  default     = 200
}

variable "anomaly_absolute_threshold" {
  description = "Absolute dollar threshold for anomaly detection"
  type        = number
  default     = 50
}

variable "budget_time_period_start" {
  description = "Budget time period start date (format: YYYY-MM-DD_HH:MM)"
  type        = string
  default     = "2024-01-01_00:00"
}

variable "cost_center" {
  description = "Cost center for resource allocation and billing"
  type        = string
  default     = "engineering"
}

variable "enable_read_replica" {
  description = "Enable read replica for database scaling"
  type        = bool
  default     = false
}

variable "db_replica_instance_class" {
  description = "RDS read replica instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "github_org" {
  description = "GitHub organization name for OIDC"
  type        = string
  default     = "mangu-publishing"
}

variable "github_repo" {
  description = "GitHub repository name for OIDC"
  type        = string
  default     = "mangu2-publishing"
}

variable "route53_zone_id" {
  description = "Route53 hosted zone ID for DNS validation"
  type        = string
  default     = ""
}

variable "create_acm_certificate" {
  description = "Whether to create ACM certificates (set to false if using existing certificate_arn)"
  type        = bool
  default     = true
}

variable "enable_zero_trust_egress" {
  description = "Enable zero-trust egress rules (restrict outbound to specific ports/destinations)"
  type        = bool
  default     = false
}

variable "allowed_egress_cidrs" {
  description = "List of CIDR blocks allowed for egress (when zero-trust is enabled)"
  type        = list(string)
  default     = []
}

# CloudFront Cache TTL Variables
variable "uploads_cache_default_ttl" {
  description = "Default TTL for user uploads cache in seconds (mutable content)"
  type        = number
  default     = 300 # 5 minutes
}

variable "uploads_cache_max_ttl" {
  description = "Maximum TTL for user uploads cache in seconds"
  type        = number
  default     = 3600 # 1 hour
}

variable "uploads_cache_min_ttl" {
  description = "Minimum TTL for user uploads cache in seconds"
  type        = number
  default     = 0
}
