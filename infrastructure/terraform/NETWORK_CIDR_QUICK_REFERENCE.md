# Network CIDR Quick Reference

## Code Snippets for Common Use Cases

### 1. Reference Centralized CIDRs in main.tf

```hcl
# Access the entire VPC CIDR
local.network.vpc

# Access public subnet CIDRs (list)
local.network.public_subnets

# Access private subnet CIDRs (list)
local.network.private_subnets

# Access a specific subnet CIDR
local.network.public_subnets[0]   # First public subnet
local.network.private_subnets[1]  # Second private subnet

# Count of subnets
length(local.network.public_subnets)
```

### 2. Use in Subnet Resources

```hcl
resource "aws_subnet" "public" {
  count      = local.az_count
  cidr_block = local.network.public_subnets[count.index]
  # ... other attributes
}

resource "aws_subnet" "private" {
  count      = local.az_count
  cidr_block = local.network.private_subnets[count.index]
  # ... other attributes
}
```

### 3. Security Group Ingress - From Specific Subnets

```hcl
# Allow from private subnets only
resource "aws_security_group" "database" {
  vpc_id = aws_vpc.main.id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = local.network.private_subnets
    description = "PostgreSQL from private subnets"
  }
}
```

### 4. Security Group Egress - To VPC

```hcl
# Allow outbound to entire VPC
egress {
  from_port   = 53
  to_port     = 53
  protocol    = "udp"
  cidr_blocks = [local.network.vpc]
  description = "DNS resolution within VPC"
}
```

### 5. DB Subnet Group

```hcl
resource "aws_db_subnet_group" "main" {
  name       = "my-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name = "My DB Subnet Group"
  }
}
```

### 6. ElastiCache Subnet Group

```hcl
resource "aws_elasticache_subnet_group" "main" {
  name       = "my-cache-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name = "My Cache Subnet Group"
  }
}
```

### 7. Network Outputs

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

### 8. Using Outputs in Other Modules

```hcl
# Module consuming network outputs
module "app" {
  source = "./modules/app"

  vpc_id             = module.network.vpc_id
  subnet_ids         = module.network.private_subnet_ids
  allowed_cidr_blocks = module.network.private_subnet_cidrs
}
```

### 9. Remote State Data Source

```hcl
data "terraform_remote_state" "network" {
  backend = "s3"
  config = {
    bucket = "mangu-terraform-state"
    key    = "production/terraform.tfstate"
    region = "us-east-1"
  }
}

# Use in resources
resource "aws_instance" "app" {
  subnet_id = data.terraform_remote_state.network.outputs.private_subnet_ids[0]
  vpc_security_group_ids = [aws_security_group.app.id]
}

resource "aws_security_group" "app" {
  vpc_id = data.terraform_remote_state.network.outputs.vpc_id

  ingress {
    cidr_blocks = data.terraform_remote_state.network.outputs.private_subnet_cidrs
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
  }
}
```

### 10. Adding Database Subnets

```hcl
# 1. Add to locals in main.tf
locals {
  network = {
    vpc             = var.vpc_cidr
    public_subnets  = [for i in range(local.az_count) : cidrsubnet(var.vpc_cidr, 8, i)]
    private_subnets = [for i in range(local.az_count) : cidrsubnet(var.vpc_cidr, 8, 10 + i)]
    
    # NEW
    database_subnets = [
      for i in range(local.az_count) : cidrsubnet(var.vpc_cidr, 8, 20 + i)
    ]
  }
}

# 2. Create subnet resources
resource "aws_subnet" "database" {
  count             = local.az_count
  vpc_id            = aws_vpc.main.id
  cidr_block        = local.network.database_subnets[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "${var.project_name}-database-subnet-${count.index + 1}"
  }
}

# 3. Add route table associations
resource "aws_route_table_association" "database" {
  count          = local.az_count
  subnet_id      = aws_subnet.database[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# 4. Update DB subnet group
resource "aws_db_subnet_group" "main" {
  subnet_ids = aws_subnet.database[*].id  # Changed from private
}

# 5. Add output
output "database_subnet_cidrs" {
  description = "List of database subnet CIDR blocks"
  value       = local.network.database_subnets
}
```

### 11. Terraform Console Examples

```bash
# Start Terraform console
terraform console

# Check VPC CIDR
> local.network.vpc
"10.0.0.0/16"

# Check public subnet CIDRs
> local.network.public_subnets
[
  "10.0.0.0/24",
  "10.0.1.0/24",
]

# Check private subnet CIDRs
> local.network.private_subnets
[
  "10.0.10.0/24",
  "10.0.11.0/24",
]

# Check first private subnet
> local.network.private_subnets[0]
"10.0.10.0/24"

# Check AZ count
> local.az_count
2

# Verify no overlaps
> cidrsubnet(var.vpc_cidr, 8, 0)
"10.0.0.0/24"
> cidrsubnet(var.vpc_cidr, 8, 10)
"10.0.10.0/24"
```

### 12. Custom Subnet Sizing

```hcl
# Larger subnets (/23 = 512 addresses instead of /24 = 256)
locals {
  network = {
    public_subnets = [
      for i in range(local.az_count) : cidrsubnet(var.vpc_cidr, 7, i)
    ]
  }
}

# Smaller subnets (/26 = 64 addresses)
locals {
  network = {
    cache_subnets = [
      for i in range(local.az_count) : cidrsubnet(var.vpc_cidr, 10, 30 + i)
    ]
  }
}
```

### 13. Environment-Specific CIDRs

```hcl
# terraform.tfvars (production)
vpc_cidr = "10.0.0.0/16"

# terraform.tfvars (staging)
vpc_cidr = "10.1.0.0/16"

# terraform.tfvars (development)
vpc_cidr = "10.2.0.0/16"

# All environments automatically get:
# - Public: x.x.0.0/24, x.x.1.0/24
# - Private: x.x.10.0/24, x.x.11.0/24
```

### 14. Validation in CI/CD

```bash
# Validate Terraform syntax
terraform validate

# Check formatting
terraform fmt -check -diff

# Generate and review plan
terraform plan -out=tfplan

# Inspect network outputs
terraform output vpc_cidr
terraform output public_subnet_cidrs
terraform output private_subnet_cidrs

# Apply changes
terraform apply tfplan
```

### 15. Security Group - Allow from Public to Private

```hcl
resource "aws_security_group" "private_app" {
  vpc_id = aws_vpc.main.id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = local.network.public_subnets
    description = "HTTPS from public subnets (ALB)"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = [local.network.vpc]
    description = "All traffic within VPC"
  }
}
```

## CIDR Allocation Table

With default `vpc_cidr = "10.0.0.0/16"`:

| Offset | Subnet Type | AZ 1 | AZ 2 | Reserved For |
|--------|------------|------|------|--------------|
| 0-9 | Public | `10.0.0.0/24` | `10.0.1.0/24` | ALB, NAT Gateways |
| 10-19 | Private | `10.0.10.0/24` | `10.0.11.0/24` | ECS, RDS, ElastiCache |
| 20-29 | Database | `10.0.20.0/24` | `10.0.21.0/24` | Future dedicated DB subnets |
| 30-39 | Cache | `10.0.30.0/24` | `10.0.31.0/24` | Future dedicated cache subnets |
| 40-49 | Reserved | `10.0.40.0/24` | `10.0.41.0/24` | Future expansion |

## Common Patterns

### Pattern 1: App in Private, ALB in Public
```hcl
# ALB in public subnets
resource "aws_lb" "main" {
  subnets = aws_subnet.public[*].id
}

# ECS tasks in private subnets
resource "aws_ecs_service" "app" {
  network_configuration {
    subnets = aws_subnet.private[*].id
  }
}
```

### Pattern 2: Tiered Security Groups
```hcl
# ALB → ECS
resource "aws_security_group" "alb" {
  egress {
    from_port       = 3000
    security_groups = [aws_security_group.ecs.id]
  }
}

# ECS → RDS
resource "aws_security_group" "ecs" {
  egress {
    from_port       = 5432
    security_groups = [aws_security_group.rds.id]
  }
}

# RDS (no outbound needed)
resource "aws_security_group" "rds" {
  ingress {
    from_port       = 5432
    security_groups = [aws_security_group.ecs.id]
  }
}
```

### Pattern 3: Conditional Subnet Creation
```hcl
variable "create_database_subnets" {
  type    = bool
  default = false
}

locals {
  network = {
    database_subnets = var.create_database_subnets ? [
      for i in range(local.az_count) : cidrsubnet(var.vpc_cidr, 8, 20 + i)
    ] : []
  }
}

resource "aws_subnet" "database" {
  count      = var.create_database_subnets ? local.az_count : 0
  cidr_block = local.network.database_subnets[count.index]
  # ...
}
```

## Troubleshooting

### Issue: "Invalid CIDR block"
**Solution:** Check offsets don't overlap
```hcl
# ❌ Bad - offset 5 overlaps with offset 0-9
public_subnets  = [for i in range(2) : cidrsubnet(var.vpc_cidr, 8, i)]     # 0, 1
private_subnets = [for i in range(2) : cidrsubnet(var.vpc_cidr, 8, 5 + i)] # 5, 6 - OVERLAP!

# ✅ Good - offset 10 has clear separation
public_subnets  = [for i in range(2) : cidrsubnet(var.vpc_cidr, 8, i)]      # 0, 1
private_subnets = [for i in range(2) : cidrsubnet(var.vpc_cidr, 8, 10 + i)] # 10, 11 - OK
```

### Issue: "Resource already exists"
**Cause:** Subnet CIDR changed, requires recreation

**Solution:** Use targeted replacement
```bash
terraform plan -replace="aws_subnet.private[0]"
```

### Issue: Can't access `local.network` from another file
**Cause:** Locals are file-scoped in some contexts

**Solution:** Use outputs for cross-module access
```hcl
# In main.tf
output "network_config" {
  value = local.network
}

# In other module
data "terraform_remote_state" "main" { ... }
locals {
  vpc_cidr = data.terraform_remote_state.main.outputs.network_config.vpc
}
```

## Further Reading

- **`NETWORK_CIDR_GUIDE.md`** - Comprehensive guide
- **`NETWORK_CIDR_IMPLEMENTATION.md`** - Implementation summary
- **[Terraform cidrsubnet function](https://developer.hashicorp.com/terraform/language/functions/cidrsubnet)**
- **[AWS VPC Subnetting Best Practices](https://docs.aws.amazon.com/vpc/latest/userguide/configure-subnets.html)**

---
Last Updated: 2025-11-11
