# AWS Secrets Manager for secure credential storage

resource "aws_secretsmanager_secret" "database_url" {
  name        = "${var.project_name}-database-url-${var.environment}"
  description = "PostgreSQL database connection string"

  recovery_window_in_days = 7

  tags = {
    Name        = "${var.project_name}-database-url"
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret" "redis_url" {
  name        = "${var.project_name}-redis-url-${var.environment}"
  description = "Redis connection string"

  recovery_window_in_days = 7

  tags = {
    Name        = "${var.project_name}-redis-url"
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret" "jwt_secret" {
  name        = "${var.project_name}-jwt-secret-${var.environment}"
  description = "JWT signing secret"

  recovery_window_in_days = 7

  tags = {
    Name        = "${var.project_name}-jwt-secret"
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret" "stripe_keys" {
  name        = "${var.project_name}-stripe-keys-${var.environment}"
  description = "Stripe API keys and webhook secrets"

  recovery_window_in_days = 7

  tags = {
    Name        = "${var.project_name}-stripe-keys"
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret" "cognito_config" {
  name        = "${var.project_name}-cognito-config-${var.environment}"
  description = "AWS Cognito configuration"

  recovery_window_in_days = 7

  tags = {
    Name        = "${var.project_name}-cognito-config"
    Environment = var.environment
  }
}

# IAM policy for ECS tasks to read secrets
resource "aws_iam_policy" "ecs_secrets_access" {
  name        = "${var.project_name}-ecs-secrets-access-${var.environment}"
  description = "Allows ECS tasks to read secrets from Secrets Manager"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = [
          aws_secretsmanager_secret.database_url.arn,
          aws_secretsmanager_secret.redis_url.arn,
          aws_secretsmanager_secret.jwt_secret.arn,
          aws_secretsmanager_secret.stripe_keys.arn,
          aws_secretsmanager_secret.cognito_config.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "kms:ViaService" = [
              "secretsmanager.${var.aws_region}.amazonaws.com"
            ]
          }
        }
      }
    ]
  })
}

# Attach secrets policy to ECS task execution role
resource "aws_iam_role_policy_attachment" "ecs_task_execution_secrets" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = aws_iam_policy.ecs_secrets_access.arn
}

# Outputs for use in ECS task definitions
output "database_url_secret_arn" {
  description = "ARN of database URL secret"
  value       = aws_secretsmanager_secret.database_url.arn
  sensitive   = true
}

output "redis_url_secret_arn" {
  description = "ARN of Redis URL secret"
  value       = aws_secretsmanager_secret.redis_url.arn
  sensitive   = true
}

output "jwt_secret_arn" {
  description = "ARN of JWT secret"
  value       = aws_secretsmanager_secret.jwt_secret.arn
  sensitive   = true
}

output "stripe_keys_secret_arn" {
  description = "ARN of Stripe keys secret"
  value       = aws_secretsmanager_secret.stripe_keys.arn
  sensitive   = true
}

output "cognito_config_secret_arn" {
  description = "ARN of Cognito config secret"
  value       = aws_secretsmanager_secret.cognito_config.arn
  sensitive   = true
}
