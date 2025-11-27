resource "random_password" "db_password" {
  length  = 32
  special = true
}

resource "aws_security_group" "rds" {
  name        = "${var.project_name}-rds-sg-${var.environment}"
  description = "Security group for RDS PostgreSQL"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = local.postgres_port
    to_port         = local.postgres_port
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
  }

  # RDS typically doesn't need egress, but keeping minimal for updates
  dynamic "egress" {
    for_each = var.enable_zero_trust_egress ? [] : [1]
    content {
      from_port   = 0
      to_port     = 0
      protocol    = "-1"
      cidr_blocks = [local.all_ipv4_cidr]
    }
  }

  # Zero-trust: RDS managed service handles internal AWS communication
  # Egress rules are not required for RDS as AWS manages health checks and monitoring internally
  # Leaving this empty block for documentation purposes

  tags = {
    Name = "${var.project_name}-rds-sg-${var.environment}"
  }
}

resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-db-subnet-${var.environment}"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name = "${var.project_name}-db-subnet-${var.environment}"
  }
}

resource "aws_db_parameter_group" "postgres" {
  name   = "${var.project_name}-postgres16-${var.environment}"
  family = "postgres16"

  # Connection Settings - Optimized for ECS Tasks
  parameter {
    name         = "max_connections"
    value        = "200"
    apply_method = "pending-reboot"
  }

  parameter {
    name  = "idle_in_transaction_session_timeout"
    value = "300000" # 5 minutes
  }

  # Memory Settings - Tuned for db.t3.medium (4GB RAM)
  parameter {
    name  = "shared_buffers"
    value = "{DBInstanceClassMemory/4096}" # 25% of RAM
  }

  parameter {
    name  = "effective_cache_size"
    value = "{DBInstanceClassMemory/1024}" # 75% of RAM
  }

  parameter {
    name  = "work_mem"
    value = "10240" # 10MB per operation
  }

  parameter {
    name  = "maintenance_work_mem"
    value = "524288" # 512MB for maintenance
  }

  # Write Performance - Optimized for SSD (gp3)
  parameter {
    name  = "checkpoint_completion_target"
    value = "0.9"
  }

  parameter {
    name  = "wal_buffers"
    value = "16384" # 16MB
  }

  parameter {
    name  = "default_statistics_target"
    value = "100"
  }

  # Query Planning - Tuned for SSD
  parameter {
    name  = "random_page_cost"
    value = "1.1"
  }

  parameter {
    name  = "effective_io_concurrency"
    value = "200" # For gp3 SSD
  }

  # Logging - Enhanced for monitoring
  parameter {
    name  = "log_min_duration_statement"
    value = "1000" # Log queries slower than 1s
  }

  parameter {
    name  = "log_connections"
    value = "1"
  }

  parameter {
    name  = "log_disconnections"
    value = "1"
  }

  parameter {
    name  = "log_lock_waits"
    value = "1"
  }

  parameter {
    name  = "log_temp_files"
    value = "0" # Log all temp file usage
  }

  # Performance Monitoring
  parameter {
    name  = "track_activity_query_size"
    value = "4096"
  }

  parameter {
    name  = "track_io_timing"
    value = "1"
  }

  # Autovacuum - Aggressive tuning for OLTP
  parameter {
    name  = "autovacuum_max_workers"
    value = "4"
  }

  parameter {
    name  = "autovacuum_naptime"
    value = "30" # 30 seconds
  }

  parameter {
    name  = "autovacuum_vacuum_cost_limit"
    value = "2000"
  }

  tags = {
    Name = "${var.project_name}-postgres16-${var.environment}"
  }
}

resource "aws_db_instance" "main" {
  identifier     = "${var.project_name}-db-${var.environment}"
  engine         = "postgres"
  engine_version = "16.1"
  instance_class = var.db_instance_class

  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = 100
  storage_type          = "gp3"
  storage_encrypted     = true
  iops                  = 3000 # gp3 baseline
  storage_throughput    = 125  # gp3 baseline MB/s

  db_name  = var.db_name
  username = var.db_username
  password = random_password.db_password.result

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  parameter_group_name   = aws_db_parameter_group.postgres.name

  multi_az                = true
  backup_retention_period = 30 # Extended for compliance
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  enabled_cloudwatch_logs_exports       = ["postgresql", "upgrade"]
  performance_insights_enabled          = true
  performance_insights_retention_period = 7

  # Enhanced monitoring
  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.rds_monitoring.arn

  deletion_protection       = var.environment == "production" ? true : false
  skip_final_snapshot       = var.environment == "production" ? false : true
  final_snapshot_identifier = var.environment == "production" ? "${var.project_name}-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}" : null

  auto_minor_version_upgrade = true
  apply_immediately          = false

  tags = {
    Name        = "${var.project_name}-db-${var.environment}"
    Environment = var.environment
    Backup      = "required"
    Monitoring  = "enhanced"
  }
}

# IAM role for enhanced monitoring
resource "aws_iam_role" "rds_monitoring" {
  name = "${var.project_name}-rds-monitoring-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-rds-monitoring-${var.environment}"
  }
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# Read replica for scaling reads (optional - enable for production)
resource "aws_db_instance" "read_replica" {
  count = var.environment == "production" && var.enable_read_replica ? 1 : 0

  identifier                 = "${var.project_name}-db-replica-${var.environment}"
  replicate_source_db        = aws_db_instance.main.identifier
  instance_class             = var.db_replica_instance_class
  publicly_accessible        = false
  skip_final_snapshot        = true
  auto_minor_version_upgrade = true

  # Performance Insights
  performance_insights_enabled          = true
  performance_insights_retention_period = 7

  # Enhanced monitoring
  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.rds_monitoring.arn

  tags = {
    Name        = "${var.project_name}-db-replica-${var.environment}"
    Environment = var.environment
    Role        = "read-replica"
  }
}

resource "aws_secretsmanager_secret" "db_credentials" {
  name        = "${var.project_name}-db-credentials-${var.environment}"
  description = "Database credentials for MANGU Publishing"

  tags = {
    Name = "${var.project_name}-db-credentials-${var.environment}"
  }
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username = var.db_username
    password = random_password.db_password.result
    engine   = "postgres"
    host     = aws_db_instance.main.address
    port     = aws_db_instance.main.port
    dbname   = var.db_name
    url      = "postgresql://${var.db_username}:${random_password.db_password.result}@${aws_db_instance.main.address}:${aws_db_instance.main.port}/${var.db_name}?sslmode=require"
  })
}

output "rds_endpoint" {
  description = "RDS endpoint"
  value       = aws_db_instance.main.endpoint
}

output "rds_secret_arn" {
  description = "ARN of database credentials secret"
  value       = aws_secretsmanager_secret.db_credentials.arn
}
