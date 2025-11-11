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
