# IAM Least Privilege Configuration for MANGU Publishing
# Service-specific roles with minimal permissions

# ========================================
# ECS Task Execution Role (Minimal AWS Service Permissions)
# ========================================
resource "aws_iam_role" "ecs_task_execution_role" {
  name = "${var.project_name}-${var.environment}-ecs-task-execution"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
      Action = "sts:AssumeRole"
      Condition = {
        StringEquals = {
          "aws:SourceAccount" = data.aws_caller_identity.current.account_id
        }
      }
    }]
  })

  permissions_boundary = aws_iam_policy.service_boundary.arn

  tags = {
    Name        = "${var.project_name}-${var.environment}-ecs-task-execution"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# Minimal execution policy for ECS tasks
resource "aws_iam_role_policy" "ecs_task_execution_policy" {
  name = "ecs-task-execution-policy"
  role = aws_iam_role.ecs_task_execution_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/ecs/${var.project_name}-${var.environment}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          aws_secretsmanager_secret.db_credentials.arn,
          aws_secretsmanager_secret.redis_credentials.arn,
          aws_secretsmanager_secret.jwt_secret.arn
        ]
      }
    ]
  })
}

# ========================================
# ECS Task Role (Application Permissions)
# ========================================
resource "aws_iam_role" "ecs_task_role" {
  name = "${var.project_name}-${var.environment}-ecs-task"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })

  permissions_boundary = aws_iam_policy.service_boundary.arn

  tags = {
    Name        = "${var.project_name}-${var.environment}-ecs-task"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# S3 access for uploads (scoped to specific bucket)
resource "aws_iam_role_policy" "ecs_task_s3_policy" {
  name = "ecs-task-s3-policy"
  role = aws_iam_role.ecs_task_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject"
        ]
        Resource = "${aws_s3_bucket.uploads.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.uploads.arn
        Condition = {
          StringLike = {
            "s3:prefix" = ["uploads/*", "books/*", "covers/*"]
          }
        }
      }
    ]
  })
}

# SES access for emails (scoped to verified domain)
resource "aws_iam_role_policy" "ecs_task_ses_policy" {
  name = "ecs-task-ses-policy"
  role = aws_iam_role.ecs_task_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ses:SendEmail",
          "ses:SendRawEmail"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "ses:FromAddress" = "noreply@mangupublishing.com"
          }
        }
      }
    ]
  })
}

# CloudWatch Logs for application logging
resource "aws_iam_role_policy" "ecs_task_logs_policy" {
  name = "ecs-task-logs-policy"
  role = aws_iam_role.ecs_task_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/ecs/${var.project_name}-${var.environment}/*"
      }
    ]
  })
}

# ========================================
# Permission Boundaries
# ========================================
resource "aws_iam_policy" "service_boundary" {
  name        = "${var.project_name}-${var.environment}-service-boundary"
  description = "Permission boundary for service roles to prevent privilege escalation"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "PreventPrivilegeEscalation"
        Effect = "Deny"
        Action = [
          "iam:CreateUser",
          "iam:CreateRole",
          "iam:CreateAccessKey",
          "iam:AttachUserPolicy",
          "iam:AttachRolePolicy",
          "iam:PutUserPolicy",
          "iam:PutRolePolicy",
          "iam:UpdateAssumeRolePolicy",
          "iam:DeleteUserPolicy",
          "iam:DeleteRolePolicy",
          "iam:DetachUserPolicy",
          "iam:DetachRolePolicy"
        ]
        Resource = "*"
      },
      {
        Sid    = "PreventSecretExfiltration"
        Effect = "Deny"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        NotResource = [
          "arn:aws:secretsmanager:${var.aws_region}:${data.aws_caller_identity.current.account_id}:secret:${var.project_name}-${var.environment}-*"
        ]
      },
      {
        Sid    = "PreventResourceDeletion"
        Effect = "Deny"
        Action = [
          "rds:DeleteDBInstance",
          "rds:DeleteDBCluster",
          "s3:DeleteBucket",
          "elasticache:DeleteCacheCluster",
          "elasticache:DeleteReplicationGroup"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "aws:RequestedRegion" = var.aws_region
          }
        }
      }
    ]
  })
}

# ========================================
# CI/CD Cross-Account Role
# ========================================
resource "aws_iam_role" "github_actions_role" {
  name = "${var.project_name}-${var.environment}-github-actions"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:oidc-provider/token.actions.githubusercontent.com"
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          }
          StringLike = {
            "token.actions.githubusercontent.com:sub" = "repo:${var.github_org}/${var.github_repo}:*"
          }
        }
      }
    ]
  })

  permissions_boundary = aws_iam_policy.cicd_boundary.arn

  tags = {
    Name        = "${var.project_name}-${var.environment}-github-actions"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# CI/CD deployment permissions (minimal for deployments only)
resource "aws_iam_role_policy" "github_actions_deploy_policy" {
  name = "github-actions-deploy-policy"
  role = aws_iam_role.github_actions_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ECRPushPull"
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:PutImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload"
        ]
        Resource = "*"
      },
      {
        Sid    = "ECSDeployment"
        Effect = "Allow"
        Action = [
          "ecs:UpdateService",
          "ecs:DescribeServices",
          "ecs:DescribeTaskDefinition",
          "ecs:RegisterTaskDefinition"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "ecs:cluster" = aws_ecs_cluster.main.arn
          }
        }
      },
      {
        Sid    = "PassRoleForECS"
        Effect = "Allow"
        Action = [
          "iam:PassRole"
        ]
        Resource = [
          aws_iam_role.ecs_task_execution_role.arn,
          aws_iam_role.ecs_task_role.arn
        ]
      },
      {
        Sid    = "CloudWatchLogs"
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/github-actions/${var.project_name}/*"
      }
    ]
  })
}

# CI/CD permission boundary
resource "aws_iam_policy" "cicd_boundary" {
  name        = "${var.project_name}-${var.environment}-cicd-boundary"
  description = "Permission boundary for CI/CD to limit deployment scope"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "DenyProductionModification"
        Effect = "Deny"
        Action = [
          "rds:ModifyDBInstance",
          "rds:DeleteDBInstance",
          "s3:DeleteBucket",
          "s3:PutBucketPolicy"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "aws:ResourceTag/Environment" = "production"
          }
        }
      },
      {
        Sid      = "RestrictRegions"
        Effect   = "Deny"
        Action   = "*"
        Resource = "*"
        Condition = {
          StringNotEquals = {
            "aws:RequestedRegion" = [var.aws_region]
          }
        }
      }
    ]
  })
}

# ========================================
# Human User Permission Boundary
# ========================================
resource "aws_iam_policy" "human_user_boundary" {
  name        = "${var.project_name}-${var.environment}-human-boundary"
  description = "Permission boundary for human users requiring MFA and session limits"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "RequireMFAForSensitiveOperations"
        Effect = "Deny"
        Action = [
          "iam:*",
          "secretsmanager:*",
          "rds:DeleteDBInstance",
          "s3:DeleteBucket"
        ]
        Resource = "*"
        Condition = {
          BoolIfExists = {
            "aws:MultiFactorAuthPresent" = "false"
          }
        }
      },
      {
        Sid      = "RestrictSessionDuration"
        Effect   = "Deny"
        Action   = "sts:AssumeRole"
        Resource = "*"
        Condition = {
          NumericGreaterThan = {
            "sts:DurationSeconds" = "3600"
          }
        }
      }
    ]
  })
}

# ========================================
# IAM Audit and Review
# ========================================
resource "aws_cloudwatch_event_rule" "iam_changes" {
  name        = "${var.project_name}-${var.environment}-iam-changes"
  description = "Capture all IAM changes for audit"

  event_pattern = jsonencode({
    source = ["aws.iam"]
    detail-type = [
      "AWS API Call via CloudTrail"
    ]
    detail = {
      eventSource = ["iam.amazonaws.com"]
      eventName = [
        "CreateUser",
        "DeleteUser",
        "CreateRole",
        "DeleteRole",
        "AttachUserPolicy",
        "AttachRolePolicy",
        "PutUserPolicy",
        "PutRolePolicy"
      ]
    }
  })

  tags = {
    Name        = "${var.project_name}-${var.environment}-iam-changes"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_cloudwatch_event_target" "iam_changes_sns" {
  rule      = aws_cloudwatch_event_rule.iam_changes.name
  target_id = "SendToSNS"
  arn       = aws_sns_topic.security_alerts.arn
}

resource "aws_sns_topic" "security_alerts" {
  name = "${var.project_name}-${var.environment}-security-alerts"

  tags = {
    Name        = "${var.project_name}-${var.environment}-security-alerts"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# ========================================
# Data Sources
# ========================================
data "aws_caller_identity" "current" {}

# ========================================
# Outputs
# ========================================
output "ecs_task_execution_role_arn" {
  value       = aws_iam_role.ecs_task_execution_role.arn
  description = "ARN of ECS task execution role"
}

output "ecs_task_role_arn" {
  value       = aws_iam_role.ecs_task_role.arn
  description = "ARN of ECS task role"
}

output "github_actions_role_arn" {
  value       = aws_iam_role.github_actions_role.arn
  description = "ARN of GitHub Actions deployment role"
}

output "security_alerts_topic_arn" {
  value       = aws_sns_topic.security_alerts.arn
  description = "ARN of SNS topic for security alerts"
}
