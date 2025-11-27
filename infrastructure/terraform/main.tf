terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
  }

  backend "s3" {
    bucket         = "mangu-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "mangu-terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      Environment = var.environment
      Project     = "MANGU-Publishing"
      ManagedBy   = "Terraform"
    }
  }
}

# CloudFront requires ACM certificates in us-east-1
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
  default_tags {
    tags = {
      Environment = var.environment
      Project     = "MANGU-Publishing"
      ManagedBy   = "Terraform"
    }
  }
}

data "aws_availability_zones" "available" {
  state = "available"
}

# AWS managed prefix lists for S3 and DynamoDB
data "aws_prefix_list" "s3" {
  filter {
    name   = "prefix-list-name"
    values = ["com.amazonaws.${var.aws_region}.s3"]
  }
}

data "aws_prefix_list" "dynamodb" {
  filter {
    name   = "prefix-list-name"
    values = ["com.amazonaws.${var.aws_region}.dynamodb"]
  }
}

locals {
  # Availability zone configuration
  az_count = 2

  # Network CIDR centralized configuration
  # This serves as the single source of truth for all VPC and subnet CIDR blocks
  network = {
    vpc = var.vpc_cidr

    # Public subnet CIDRs (one per AZ)
    # Calculated once and reused across resources
    public_subnets = [
      for i in range(local.az_count) : cidrsubnet(var.vpc_cidr, 8, i)
    ]

    # Private subnet CIDRs (one per AZ)
    # Using offset of 10 to avoid overlap with public subnets
    private_subnets = [
      for i in range(local.az_count) : cidrsubnet(var.vpc_cidr, 8, 10 + i)
    ]

    # Reserved for future database-specific subnets (if needed)
    # database_subnets = [
    #   for i in range(local.az_count) : cidrsubnet(var.vpc_cidr, 8, 20 + i)
    # ]

    # Reserved for future elasticache-specific subnets (if needed)
    # cache_subnets = [
    #   for i in range(local.az_count) : cidrsubnet(var.vpc_cidr, 8, 30 + i)
    # ]
  }

  # Legacy references for backwards compatibility
  vpc_cidr = local.network.vpc

  # Network CIDR blocks for security groups
  all_ipv4_cidr = "0.0.0.0/0"
  all_ipv6_cidr = "::/0"

  # Common ports
  http_port     = 80
  https_port    = 443
  postgres_port = 5432
  redis_port    = 6379
  smtp_port     = 587
  smtps_port    = 465
  dns_port      = 53
  ntp_port      = 123

  # AWS service endpoints (for VPC endpoints or egress filtering)
  aws_s3_prefix_list_id       = data.aws_prefix_list.s3.id
  aws_dynamodb_prefix_list_id = data.aws_prefix_list.dynamodb.id
}

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${var.project_name}-vpc-${var.environment}"
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.project_name}-igw-${var.environment}"
  }
}

resource "aws_subnet" "public" {
  count                   = local.az_count
  vpc_id                  = aws_vpc.main.id
  cidr_block              = local.network.public_subnets[count.index]
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.project_name}-public-subnet-${count.index + 1}-${var.environment}"
  }
}

resource "aws_subnet" "private" {
  count             = local.az_count
  vpc_id            = aws_vpc.main.id
  cidr_block        = local.network.private_subnets[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "${var.project_name}-private-subnet-${count.index + 1}-${var.environment}"
  }
}

resource "aws_nat_gateway" "main" {
  count         = local.az_count
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name = "${var.project_name}-nat-${count.index + 1}-${var.environment}"
  }
}

resource "aws_eip" "nat" {
  count  = local.az_count
  domain = "vpc"

  tags = {
    Name = "${var.project_name}-eip-${count.index + 1}-${var.environment}"
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = local.all_ipv4_cidr
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "${var.project_name}-public-rt-${var.environment}"
  }
}

resource "aws_route_table" "private" {
  count  = local.az_count
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = local.all_ipv4_cidr
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = {
    Name = "${var.project_name}-private-rt-${count.index + 1}-${var.environment}"
  }
}

resource "aws_route_table_association" "public" {
  count          = local.az_count
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count          = local.az_count
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

resource "aws_security_group" "alb" {
  name        = "${var.project_name}-alb-sg-${var.environment}"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = local.http_port
    to_port     = local.http_port
    protocol    = "tcp"
    cidr_blocks = [local.all_ipv4_cidr]
  }

  ingress {
    from_port   = local.https_port
    to_port     = local.https_port
    protocol    = "tcp"
    cidr_blocks = [local.all_ipv4_cidr]
  }

  # Permissive egress (default - ALB needs to reach targets)
  dynamic "egress" {
    for_each = var.enable_zero_trust_egress ? [] : [1]
    content {
      from_port   = 0
      to_port     = 0
      protocol    = "-1"
      cidr_blocks = [local.all_ipv4_cidr]
    }
  }

  # Zero-trust egress - only to ECS tasks on specific ports
  # Use CIDR blocks instead of security group reference to avoid circular dependency
  dynamic "egress" {
    for_each = var.enable_zero_trust_egress ? [1] : []
    content {
      from_port   = 3000
      to_port     = 3000
      protocol    = "tcp"
      cidr_blocks = local.network.private_subnets
      description = "HTTP to ECS server tasks (port 3000) via private subnets"
    }
  }

  dynamic "egress" {
    for_each = var.enable_zero_trust_egress ? [1] : []
    content {
      from_port   = local.http_port
      to_port     = local.http_port
      protocol    = "tcp"
      cidr_blocks = local.network.private_subnets
      description = "HTTP to ECS client tasks (port 80) via private subnets"
    }
  }

  dynamic "egress" {
    for_each = var.enable_zero_trust_egress && var.environment == "development" ? [1] : []
    content {
      from_port   = 5173
      to_port     = 5173
      protocol    = "tcp"
      cidr_blocks = local.network.private_subnets
      description = "Vite dev server (development only) via private subnets"
    }
  }

  tags = {
    Name = "${var.project_name}-alb-sg-${var.environment}"
  }
}

resource "aws_security_group" "ecs_tasks" {
  name        = "${var.project_name}-ecs-tasks-sg-${var.environment}"
  description = "Security group for ECS tasks"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  dynamic "ingress" {
    for_each = var.environment == "development" ? [1] : []
    content {
      from_port       = 5173
      to_port         = 5173
      protocol        = "tcp"
      security_groups = [aws_security_group.alb.id]
      description     = "Vite dev server (development only)"
    }
  }

  # Permissive egress (default)
  dynamic "egress" {
    for_each = var.enable_zero_trust_egress ? [] : [1]
    content {
      from_port   = 0
      to_port     = 0
      protocol    = "-1"
      cidr_blocks = [local.all_ipv4_cidr]
    }
  }

  # Zero-trust egress rules for ECS tasks
  # HTTPS for external APIs (AWS services, Stripe, etc.)
  # Note: This allows HTTPS to internet via NAT - required for AWS SDK, external APIs, and npm/yarn registries
  # To further restrict, consider VPC endpoints for AWS services (S3, SES, Secrets Manager, ECR)
  dynamic "egress" {
    for_each = var.enable_zero_trust_egress ? [1] : []
    content {
      from_port   = local.https_port
      to_port     = local.https_port
      protocol    = "tcp"
      cidr_blocks = [local.all_ipv4_cidr]
      description = "HTTPS for external APIs, AWS services, and package registries (via NAT)"
    }
  }

  # PostgreSQL to RDS
  # Use CIDR blocks instead of security group reference to avoid circular dependency
  dynamic "egress" {
    for_each = var.enable_zero_trust_egress ? [1] : []
    content {
      from_port   = local.postgres_port
      to_port     = local.postgres_port
      protocol    = "tcp"
      cidr_blocks = local.network.private_subnets
      description = "PostgreSQL to RDS (via private subnets)"
    }
  }

  # Redis to ElastiCache
  # Use CIDR blocks instead of security group reference to avoid circular dependency
  dynamic "egress" {
    for_each = var.enable_zero_trust_egress ? [1] : []
    content {
      from_port   = local.redis_port
      to_port     = local.redis_port
      protocol    = "tcp"
      cidr_blocks = local.network.private_subnets
      description = "Redis to ElastiCache (via private subnets)"
    }
  }

  # SMTP/SMTPS for SES
  dynamic "egress" {
    for_each = var.enable_zero_trust_egress ? [1] : []
    content {
      from_port   = local.smtp_port
      to_port     = local.smtp_port
      protocol    = "tcp"
      cidr_blocks = [local.all_ipv4_cidr]
      description = "SMTP for email sending (SES)"
    }
  }

  dynamic "egress" {
    for_each = var.enable_zero_trust_egress ? [1] : []
    content {
      from_port   = local.smtps_port
      to_port     = local.smtps_port
      protocol    = "tcp"
      cidr_blocks = [local.all_ipv4_cidr]
      description = "SMTPS for email sending (SES)"
    }
  }

  # DNS for name resolution
  dynamic "egress" {
    for_each = var.enable_zero_trust_egress ? [1] : []
    content {
      from_port   = local.dns_port
      to_port     = local.dns_port
      protocol    = "udp"
      cidr_blocks = [local.vpc_cidr]
      description = "DNS resolution"
    }
  }

  # NTP for time synchronization
  dynamic "egress" {
    for_each = var.enable_zero_trust_egress ? [1] : []
    content {
      from_port   = local.ntp_port
      to_port     = local.ntp_port
      protocol    = "udp"
      cidr_blocks = [local.all_ipv4_cidr]
      description = "NTP for time sync"
    }
  }

  # S3 via prefix list
  dynamic "egress" {
    for_each = var.enable_zero_trust_egress ? [1] : []
    content {
      from_port       = local.https_port
      to_port         = local.https_port
      protocol        = "tcp"
      prefix_list_ids = [local.aws_s3_prefix_list_id]
      description     = "S3 access via prefix list"
    }
  }

  tags = {
    Name = "${var.project_name}-ecs-tasks-sg-${var.environment}"
  }
}

# ============================================================================
# Network Outputs
# ============================================================================
# These outputs expose the centralized network CIDR definitions for use by
# other modules, documentation, and infrastructure-as-code consumers.

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "VPC CIDR block"
  value       = local.network.vpc
}

output "public_subnet_ids" {
  description = "List of public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "public_subnet_cidrs" {
  description = "List of public subnet CIDR blocks"
  value       = local.network.public_subnets
}

output "private_subnet_ids" {
  description = "List of private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "private_subnet_cidrs" {
  description = "List of private subnet CIDR blocks"
  value       = local.network.private_subnets
}

output "availability_zones" {
  description = "List of availability zones used"
  value       = data.aws_availability_zones.available.names[*]
}

output "nat_gateway_ips" {
  description = "Elastic IPs assigned to NAT Gateways"
  value       = aws_eip.nat[*].public_ip
}
