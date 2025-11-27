# CloudTrail and Audit Logging for MANGU Publishing
# Comprehensive compliance logging for SOC2, GDPR, and security auditing

# ========================================
# S3 Bucket for CloudTrail Logs
# ========================================
resource "aws_s3_bucket" "cloudtrail_logs" {
  bucket = "${var.project_name}-${var.environment}-cloudtrail-logs"

  tags = {
    Name        = "${var.project_name}-${var.environment}-cloudtrail-logs"
    Environment = var.environment
    ManagedBy   = "terraform"
    Purpose     = "audit-logging"
    Compliance  = "SOC2,GDPR"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "cloudtrail_logs_lifecycle" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  rule {
    id     = "archive-old-logs"
    status = "Enabled"

    transition {
      days          = 90
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 365
      storage_class = "GLACIER"
    }

    expiration {
      days = 2555 # 7 years retention for compliance
    }
  }

  rule {
    id     = "abort-incomplete-uploads"
    status = "Enabled"

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}

resource "aws_s3_bucket_versioning" "cloudtrail_logs_versioning" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail_logs_encryption" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.cloudtrail.arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "cloudtrail_logs_public_access" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "cloudtrail_logs_policy" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSCloudTrailAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.cloudtrail_logs.arn
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.cloudtrail_logs.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      },
      {
        Sid    = "DenyUnencryptedObjectUploads"
        Effect = "Deny"
        Principal = {
          AWS = "*"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.cloudtrail_logs.arn}/*"
        Condition = {
          StringNotEquals = {
            "s3:x-amz-server-side-encryption" = "aws:kms"
          }
        }
      },
      {
        Sid    = "DenyInsecureTransport"
        Effect = "Deny"
        Principal = {
          AWS = "*"
        }
        Action = "s3:*"
        Resource = [
          aws_s3_bucket.cloudtrail_logs.arn,
          "${aws_s3_bucket.cloudtrail_logs.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })
}

# ========================================
# KMS Key for CloudTrail Encryption
# ========================================
resource "aws_kms_key" "cloudtrail" {
  description             = "KMS key for CloudTrail log encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow CloudTrail to encrypt logs"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action = [
          "kms:GenerateDataKey*",
          "kms:DecryptDataKey"
        ]
        Resource = "*"
        Condition = {
          StringLike = {
            "kms:EncryptionContext:aws:cloudtrail:arn" = "arn:aws:cloudtrail:*:${data.aws_caller_identity.current.account_id}:trail/*"
          }
        }
      },
      {
        Sid    = "Allow CloudTrail to describe key"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "kms:DescribeKey"
        Resource = "*"
      }
    ]
  })

  tags = {
    Name        = "${var.project_name}-${var.environment}-cloudtrail-key"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_kms_alias" "cloudtrail" {
  name          = "alias/${var.project_name}-${var.environment}-cloudtrail"
  target_key_id = aws_kms_key.cloudtrail.key_id
}

# ========================================
# CloudTrail Configuration
# ========================================
resource "aws_cloudtrail" "main" {
  name                          = "${var.project_name}-${var.environment}-trail"
  s3_bucket_name                = aws_s3_bucket.cloudtrail_logs.id
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_log_file_validation    = true
  kms_key_id                    = aws_kms_key.cloudtrail.arn

  event_selector {
    read_write_type           = "All"
    include_management_events = true

    data_resource {
      type = "AWS::S3::Object"
      values = [
        "${aws_s3_bucket.uploads.arn}/*",
        "${aws_s3_bucket.static_assets.arn}/*"
      ]
    }

    data_resource {
      type   = "AWS::Lambda::Function"
      values = ["arn:aws:lambda:${var.aws_region}:${data.aws_caller_identity.current.account_id}:function:${var.project_name}-${var.environment}-*"]
    }
  }

  insight_selector {
    insight_type = "ApiCallRateInsight"
  }

  cloud_watch_logs_group_arn = "${aws_cloudwatch_log_group.cloudtrail.arn}:*"
  cloud_watch_logs_role_arn  = aws_iam_role.cloudtrail_cloudwatch.arn

  tags = {
    Name        = "${var.project_name}-${var.environment}-trail"
    Environment = var.environment
    ManagedBy   = "terraform"
    Compliance  = "SOC2,GDPR,HIPAA"
  }

  depends_on = [
    aws_s3_bucket_policy.cloudtrail_logs_policy
  ]
}

# ========================================
# CloudWatch Logs for CloudTrail
# ========================================
resource "aws_cloudwatch_log_group" "cloudtrail" {
  name              = "/aws/cloudtrail/${var.project_name}-${var.environment}"
  retention_in_days = 365
  kms_key_id        = aws_kms_key.cloudtrail.arn

  tags = {
    Name        = "${var.project_name}-${var.environment}-cloudtrail-logs"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_iam_role" "cloudtrail_cloudwatch" {
  name = "${var.project_name}-${var.environment}-cloudtrail-cloudwatch"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "cloudtrail.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })

  tags = {
    Name        = "${var.project_name}-${var.environment}-cloudtrail-cloudwatch"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_iam_role_policy" "cloudtrail_cloudwatch_policy" {
  name = "cloudtrail-cloudwatch-policy"
  role = aws_iam_role.cloudtrail_cloudwatch.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSCloudTrailCreateLogStream"
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.cloudtrail.arn}:*"
      }
    ]
  })
}

# ========================================
# S3 Bucket Access Logging
# ========================================
resource "aws_s3_bucket" "access_logs" {
  bucket = "${var.project_name}-${var.environment}-access-logs"

  tags = {
    Name        = "${var.project_name}-${var.environment}-access-logs"
    Environment = var.environment
    ManagedBy   = "terraform"
    Purpose     = "s3-access-logs"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "access_logs_lifecycle" {
  bucket = aws_s3_bucket.access_logs.id

  rule {
    id     = "expire-old-logs"
    status = "Enabled"

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    expiration {
      days = 365
    }
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "access_logs_encryption" {
  bucket = aws_s3_bucket.access_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "access_logs_public_access" {
  bucket = aws_s3_bucket.access_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_logging" "uploads_logging" {
  bucket = aws_s3_bucket.uploads.id

  target_bucket = aws_s3_bucket.access_logs.id
  target_prefix = "uploads-logs/"
}

resource "aws_s3_bucket_logging" "static_assets_logging" {
  bucket = aws_s3_bucket.static_assets.id

  target_bucket = aws_s3_bucket.access_logs.id
  target_prefix = "static-assets-logs/"
}

# ========================================
# Anomaly Detection and Alerting
# ========================================
resource "aws_cloudwatch_log_metric_filter" "unauthorized_api_calls" {
  name           = "${var.project_name}-${var.environment}-unauthorized-api-calls"
  log_group_name = aws_cloudwatch_log_group.cloudtrail.name
  pattern        = "{ ($.errorCode = \"*UnauthorizedOperation\") || ($.errorCode = \"AccessDenied*\") }"

  metric_transformation {
    name      = "UnauthorizedAPICalls"
    namespace = "${var.project_name}/${var.environment}/Security"
    value     = "1"
  }
}

resource "aws_cloudwatch_metric_alarm" "unauthorized_api_calls" {
  alarm_name          = "${var.project_name}-${var.environment}-unauthorized-api-calls"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "UnauthorizedAPICalls"
  namespace           = "${var.project_name}/${var.environment}/Security"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "Triggers when unauthorized API calls exceed threshold"
  alarm_actions       = [aws_sns_topic.security_alerts.arn]

  tags = {
    Name        = "${var.project_name}-${var.environment}-unauthorized-api-calls"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_cloudwatch_log_metric_filter" "root_account_usage" {
  name           = "${var.project_name}-${var.environment}-root-account-usage"
  log_group_name = aws_cloudwatch_log_group.cloudtrail.name
  pattern        = "{ $.userIdentity.type = \"Root\" && $.userIdentity.invokedBy NOT EXISTS && $.eventType != \"AwsServiceEvent\" }"

  metric_transformation {
    name      = "RootAccountUsage"
    namespace = "${var.project_name}/${var.environment}/Security"
    value     = "1"
  }
}

resource "aws_cloudwatch_metric_alarm" "root_account_usage" {
  alarm_name          = "${var.project_name}-${var.environment}-root-account-usage"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "1"
  metric_name         = "RootAccountUsage"
  namespace           = "${var.project_name}/${var.environment}/Security"
  period              = "60"
  statistic           = "Sum"
  threshold           = "1"
  alarm_description   = "Triggers on any root account usage"
  alarm_actions       = [aws_sns_topic.security_alerts.arn]

  tags = {
    Name        = "${var.project_name}-${var.environment}-root-account-usage"
    Environment = var.environment
    ManagedBy   = "terraform"
    Severity    = "critical"
  }
}

resource "aws_cloudwatch_log_metric_filter" "iam_policy_changes" {
  name           = "${var.project_name}-${var.environment}-iam-policy-changes"
  log_group_name = aws_cloudwatch_log_group.cloudtrail.name
  pattern        = "{($.eventName=DeleteGroupPolicy)||($.eventName=DeleteRolePolicy)||($.eventName=DeleteUserPolicy)||($.eventName=PutGroupPolicy)||($.eventName=PutRolePolicy)||($.eventName=PutUserPolicy)||($.eventName=CreatePolicy)||($.eventName=DeletePolicy)||($.eventName=CreatePolicyVersion)||($.eventName=DeletePolicyVersion)||($.eventName=AttachRolePolicy)||($.eventName=DetachRolePolicy)||($.eventName=AttachUserPolicy)||($.eventName=DetachUserPolicy)||($.eventName=AttachGroupPolicy)||($.eventName=DetachGroupPolicy)}"

  metric_transformation {
    name      = "IAMPolicyChanges"
    namespace = "${var.project_name}/${var.environment}/Security"
    value     = "1"
  }
}

resource "aws_cloudwatch_metric_alarm" "iam_policy_changes" {
  alarm_name          = "${var.project_name}-${var.environment}-iam-policy-changes"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "1"
  metric_name         = "IAMPolicyChanges"
  namespace           = "${var.project_name}/${var.environment}/Security"
  period              = "300"
  statistic           = "Sum"
  threshold           = "1"
  alarm_description   = "Triggers on IAM policy changes"
  alarm_actions       = [aws_sns_topic.security_alerts.arn]

  tags = {
    Name        = "${var.project_name}-${var.environment}-iam-policy-changes"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_cloudwatch_log_metric_filter" "console_login_failures" {
  name           = "${var.project_name}-${var.environment}-console-login-failures"
  log_group_name = aws_cloudwatch_log_group.cloudtrail.name
  pattern        = "{ ($.eventName = ConsoleLogin) && ($.errorMessage = \"Failed authentication\") }"

  metric_transformation {
    name      = "ConsoleLoginFailures"
    namespace = "${var.project_name}/${var.environment}/Security"
    value     = "1"
  }
}

resource "aws_cloudwatch_metric_alarm" "console_login_failures" {
  alarm_name          = "${var.project_name}-${var.environment}-console-login-failures"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ConsoleLoginFailures"
  namespace           = "${var.project_name}/${var.environment}/Security"
  period              = "300"
  statistic           = "Sum"
  threshold           = "3"
  alarm_description   = "Triggers on multiple console login failures"
  alarm_actions       = [aws_sns_topic.security_alerts.arn]

  tags = {
    Name        = "${var.project_name}-${var.environment}-console-login-failures"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# ========================================
# Compliance Reporting Framework
# ========================================
resource "aws_cloudwatch_event_rule" "daily_compliance_report" {
  name                = "${var.project_name}-${var.environment}-daily-compliance"
  description         = "Trigger daily compliance report generation"
  schedule_expression = "cron(0 8 * * ? *)" # 8 AM UTC daily

  tags = {
    Name        = "${var.project_name}-${var.environment}-daily-compliance"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_cloudwatch_event_target" "daily_compliance_lambda" {
  rule      = aws_cloudwatch_event_rule.daily_compliance_report.name
  target_id = "ComplianceReportLambda"
  arn       = aws_lambda_function.compliance_report.arn
}

resource "aws_lambda_function" "compliance_report" {
  filename      = "compliance_report.zip" # To be created
  function_name = "${var.project_name}-${var.environment}-compliance-report"
  role          = aws_iam_role.compliance_lambda.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  timeout       = 300

  environment {
    variables = {
      CLOUDTRAIL_BUCKET = aws_s3_bucket.cloudtrail_logs.id
      REPORT_BUCKET     = aws_s3_bucket.compliance_reports.id
      ENVIRONMENT       = var.environment
    }
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-compliance-report"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_iam_role" "compliance_lambda" {
  name = "${var.project_name}-${var.environment}-compliance-lambda"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })

  tags = {
    Name        = "${var.project_name}-${var.environment}-compliance-lambda"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_iam_role_policy_attachment" "compliance_lambda_basic" {
  role       = aws_iam_role.compliance_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_s3_bucket" "compliance_reports" {
  bucket = "${var.project_name}-${var.environment}-compliance-reports"

  tags = {
    Name        = "${var.project_name}-${var.environment}-compliance-reports"
    Environment = var.environment
    ManagedBy   = "terraform"
    Purpose     = "compliance-reporting"
  }
}

resource "aws_lambda_permission" "allow_cloudwatch_compliance" {
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.compliance_report.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.daily_compliance_report.arn
}

# ========================================
# Outputs
# ========================================
output "cloudtrail_name" {
  value       = aws_cloudtrail.main.name
  description = "Name of the CloudTrail trail"
}

output "cloudtrail_bucket" {
  value       = aws_s3_bucket.cloudtrail_logs.id
  description = "S3 bucket for CloudTrail logs"
}

output "cloudwatch_log_group" {
  value       = aws_cloudwatch_log_group.cloudtrail.name
  description = "CloudWatch log group for CloudTrail"
}

output "compliance_reports_bucket" {
  value       = aws_s3_bucket.compliance_reports.id
  description = "S3 bucket for compliance reports"
}
