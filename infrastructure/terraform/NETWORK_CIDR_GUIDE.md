# Network CIDR Centralization Guide

## Overview

All VPC and subnet CIDR definitions are centralized in `main.tf` under the `locals.network` block. This serves as the **single source of truth** for network addressing throughout the infrastructure.

## Current Structure

### Locals Block (`main.tf`)

```hcl
locals {
  az_count = 2
  
  network = {
    vpc = var.vpc_cidr
    
    # Public subnets (one per AZ)
    public_subnets = [
      for i in range(local.az_count) : cidrsubnet(var.vpc_cidr, 8, i)
    ]
    
    # Private subnets (one per AZ)
    private_subnets = [
      for i in range(local.az_count) : cidrsubnet(var.vpc_cidr, 8, 10 + i)
    ]
  }
}
```

### Default CIDR Allocation (with `vpc_cidr = "10.0.0.0/16"`)

| Subnet Type | AZ 1 | AZ 2 | Purpose |
|-------------|------|------|---------|
| **Public** | `10.0.0.0/24` | `10.0.1.0/24` | ALB, NAT Gateways |
| **Private** | `10.0.10.0/24` | `10.0.11.0/24` | ECS Tasks, RDS, ElastiCache |
| **Reserved (DB)** | `10.0.20.0/24` | `10.0.21.0/24` | Future dedicated database subnets |
| **Reserved (Cache)** | `10.0.30.0/24` | `10.0.31.0/24` | Future dedicated cache subnets |

## How Subnets Are Used

### Resources Consuming Centralized CIDRs

#### 1. VPC Subnets (`main.tf`)
```hcl
resource "aws_subnet" "public" {
  count      = local.az_count
  cidr_block = local.network.public_subnets[count.index]
  # ...
}

resource "aws_subnet" "private" {
  count      = local.az_count
  cidr_block = local.network.private_subnets[count.index]
  # ...
}
```

#### 2. RDS Subnet Group (`rds.tf`)
```hcl
resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-db-subnet-${var.environment}"
  subnet_ids = aws_subnet.private[*].id  # Uses private subnets
}
```

#### 3. ElastiCache Subnet Group (`elasticache.tf`)
```hcl
resource "aws_elasticache_subnet_group" "main" {
  name       = "${var.project_name}-redis-subnet-${var.environment}"
  subnet_ids = aws_subnet.private[*].id  # Uses private subnets
}
```

#### 4. Security Groups
Security groups reference `local.vpc_cidr` for intra-VPC rules:

```hcl
# Example: DNS resolution within VPC
egress {
  from_port   = 53
  to_port     = 53
  protocol    = "udp"
  cidr_blocks = [local.vpc_cidr]
  description = "DNS resolution"
}
```

## Outputs for Module Reuse

Network outputs are available in `main.tf`:

```hcl
output "vpc_cidr" {
  description = "VPC CIDR block"
  value       = local.network.vpc
}

output "public_subnet_cidrs" {
  description = "List of public subnet CIDR blocks"
  value       = local.network.public_subnets
}

output "private_subnet_cidrs" {
  description = "List of private subnet CIDR blocks"
  value       = local.network.private_subnets
}
```

**Usage in other modules:**
```hcl
module "custom_service" {
  source = "./modules/custom_service"
  
  vpc_id             = module.networking.vpc_id
  subnet_ids         = module.networking.private_subnet_ids
  allowed_cidr_blocks = module.networking.private_subnet_cidrs
}
```

## Extending the Network Configuration

### Adding New Subnet Types

#### Example: Dedicated Database Subnets

1. **Add to `locals.network` in `main.tf`:**
```hcl
locals {
  network = {
    vpc             = var.vpc_cidr
    public_subnets  = [for i in range(local.az_count) : cidrsubnet(var.vpc_cidr, 8, i)]
    private_subnets = [for i in range(local.az_count) : cidrsubnet(var.vpc_cidr, 8, 10 + i)]
    
    # NEW: Dedicated database subnets
    database_subnets = [
      for i in range(local.az_count) : cidrsubnet(var.vpc_cidr, 8, 20 + i)
    ]
  }
}
```

2. **Create subnet resources:**
```hcl
resource "aws_subnet" "database" {
  count             = local.az_count
  vpc_id            = aws_vpc.main.id
  cidr_block        = local.network.database_subnets[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "${var.project_name}-database-subnet-${count.index + 1}-${var.environment}"
    Type = "database"
  }
}
```

3. **Update RDS subnet group:**
```hcl
resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-db-subnet-${var.environment}"
  subnet_ids = aws_subnet.database[*].id  # Use dedicated database subnets
}
```

4. **Add outputs:**
```hcl
output "database_subnet_ids" {
  description = "List of database subnet IDs"
  value       = aws_subnet.database[*].id
}

output "database_subnet_cidrs" {
  description = "List of database subnet CIDR blocks"
  value       = local.network.database_subnets
}
```

#### Example: Increasing Availability Zones

To expand from 2 to 3 AZs:

1. **Update `locals.az_count` in `main.tf`:**
```hcl
locals {
  az_count = 3  # Changed from 2
  # ...
}
```

The `for` loops automatically generate the additional subnet CIDRs:
- Public: `10.0.0.0/24`, `10.0.1.0/24`, `10.0.2.0/24`
- Private: `10.0.10.0/24`, `10.0.11.0/24`, `10.0.12.0/24`

### Customizing Subnet Sizing

The current configuration uses `/24` subnets (256 addresses each). To adjust:

**Larger subnets** (e.g., `/23` = 512 addresses):
```hcl
public_subnets = [
  for i in range(local.az_count) : cidrsubnet(var.vpc_cidr, 7, i)  # Changed from 8 to 7
]
```

**Smaller subnets** (e.g., `/26` = 64 addresses):
```hcl
cache_subnets = [
  for i in range(local.az_count) : cidrsubnet(var.vpc_cidr, 10, 30 + i)  # /26 subnets
]
```

### Changing Base VPC CIDR

Update `terraform.tfvars`:
```hcl
vpc_cidr = "172.16.0.0/16"  # New VPC CIDR
```

All subnet calculations automatically adjust:
- Public: `172.16.0.0/24`, `172.16.1.0/24`
- Private: `172.16.10.0/24`, `172.16.11.0/24`

## Security Group Best Practices

### Referencing Centralized CIDRs

**DO** - Use centralized locals:
```hcl
ingress {
  from_port   = 5432
  to_port     = 5432
  protocol    = "tcp"
  cidr_blocks = local.network.private_subnets  # ✅ Good
  description = "PostgreSQL from private subnets"
}
```

**DON'T** - Hardcode CIDRs:
```hcl
ingress {
  cidr_blocks = ["10.0.10.0/24", "10.0.11.0/24"]  # ❌ Bad - duplicates logic
}
```

### Intra-VPC Communication

For rules allowing all VPC traffic:
```hcl
ingress {
  from_port   = 0
  to_port     = 0
  protocol    = "-1"
  cidr_blocks = [local.vpc_cidr]  # Entire VPC
  description = "Allow all from VPC"
}
```

## Validation and Testing

### Terraform Plan Check

```bash
cd infrastructure/terraform
terraform plan -out=tfplan
```

Look for changes in:
- `aws_subnet.public` and `aws_subnet.private` (should show CIDR updates if you changed offsets)
- Security group rules referencing CIDR blocks

### Verify No Overlapping Subnets

```bash
terraform console
> local.network.public_subnets
> local.network.private_subnets
```

Ensure no overlaps between subnet ranges.

### Apply Changes

```bash
terraform apply tfplan
```

**Note:** Changing subnet CIDRs requires recreating subnets, which **will cause downtime**. Plan accordingly.

## Troubleshooting

### Issue: "Invalid CIDR block" errors

**Cause:** Overlapping subnet ranges or invalid offsets.

**Solution:** Review offset values in `cidrsubnet()` calls:
```hcl
public_subnets  = [for i in range(2) : cidrsubnet(var.vpc_cidr, 8, 0 + i)]   # 0, 1
private_subnets = [for i in range(2) : cidrsubnet(var.vpc_cidr, 8, 10 + i)]  # 10, 11
# Ensure offset gaps prevent overlaps
```

### Issue: Security group rules not updated

**Cause:** Using hardcoded CIDRs instead of `local.network.*`.

**Solution:** Replace hardcoded values with references:
```hcl
# Before
cidr_blocks = ["10.0.10.0/24"]

# After
cidr_blocks = local.network.private_subnets
```

## Integration with External Modules

When consuming this infrastructure from other Terraform modules or workspaces:

```hcl
# Root module (e.g., infrastructure/terraform/)
output "network_config" {
  description = "Complete network configuration"
  value = {
    vpc_id              = aws_vpc.main.id
    vpc_cidr            = local.network.vpc
    public_subnet_ids   = aws_subnet.public[*].id
    public_subnet_cidrs = local.network.public_subnets
    private_subnet_ids  = aws_subnet.private[*].id
    private_subnet_cidrs = local.network.private_subnets
  }
}

# Consumer module
data "terraform_remote_state" "network" {
  backend = "s3"
  config = {
    bucket = "mangu-terraform-state"
    key    = "production/terraform.tfstate"
    region = "us-east-1"
  }
}

resource "aws_security_group" "app" {
  vpc_id = data.terraform_remote_state.network.outputs.network_config.vpc_id
  
  ingress {
    cidr_blocks = data.terraform_remote_state.network.outputs.network_config.private_subnet_cidrs
    # ...
  }
}
```

## Summary

✅ **Benefits of Centralization:**
- Single source of truth for all network CIDRs
- Easy to adjust subnet sizing and offsets
- Prevents CIDR drift and duplication
- Simplifies multi-AZ expansion
- Clear documentation via outputs

✅ **Key Files:**
- `main.tf` - Contains `locals.network` block and subnet resources
- `rds.tf` - Uses `aws_subnet.private[*].id`
- `elasticache.tf` - Uses `aws_subnet.private[*].id`
- `variables.tf` - Defines `vpc_cidr` variable
- `terraform.tfvars` - Sets environment-specific VPC CIDR

✅ **Next Steps:**
1. Review the `locals.network` structure
2. Plan any subnet type additions (database, cache, etc.)
3. Update security groups to reference centralized CIDRs
4. Document environment-specific CIDR allocations in `terraform.tfvars`

For questions or issues, refer to the main infrastructure README or consult the Terraform documentation.
