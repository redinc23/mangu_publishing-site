# SNS Topic for Budget and Cost Alerts
resource "aws_sns_topic" "cost_alerts" {
  name = "${var.project_name}-cost-alerts-${var.environment}"

  tags = {
    Name       = "${var.project_name}-cost-alerts-${var.environment}"
    CostCenter = var.cost_center
    Component  = "monitoring"
  }
}

resource "aws_sns_topic_subscription" "cost_alerts_email" {
  count     = length(var.budget_alert_emails)
  topic_arn = aws_sns_topic.cost_alerts.arn
  protocol  = "email"
  endpoint  = var.budget_alert_emails[count.index]
}

# Monthly Budget with SNS Integration
resource "aws_budgets_budget" "monthly" {
  name              = "${var.project_name}-monthly-budget-${var.environment}"
  budget_type       = "COST"
  limit_amount      = tostring(var.monthly_budget_limit)
  limit_unit        = "USD"
  time_period_start = var.budget_time_period_start
  time_unit         = "MONTHLY"

  cost_filter {
    name = "TagKeyValue"
    values = [
      "user:Project$MANGU-Publishing",
    ]
  }

  # 80% threshold - warning
  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 80
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = var.budget_alert_emails
    subscriber_sns_topic_arns  = [aws_sns_topic.cost_alerts.arn]
  }

  # 100% threshold - critical
  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = var.budget_alert_emails
    subscriber_sns_topic_arns  = [aws_sns_topic.cost_alerts.arn]
  }

  # 90% forecasted - proactive alert
  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 90
    threshold_type             = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_email_addresses = var.budget_alert_emails
    subscriber_sns_topic_arns  = [aws_sns_topic.cost_alerts.arn]
  }

  lifecycle {
    # Temporarily disabled for deployment - will re-enable after apply
    # prevent_destroy = true
  }

  tags = {
    Name       = "${var.project_name}-monthly-budget-${var.environment}"
    CostCenter = var.cost_center
    Component  = "monitoring"
  }
}

# Service-specific budgets for cost tracking
resource "aws_budgets_budget" "ecs_budget" {
  name              = "${var.project_name}-ecs-budget-${var.environment}"
  budget_type       = "COST"
  limit_amount      = tostring(var.ecs_budget_limit)
  limit_unit        = "USD"
  time_period_start = var.budget_time_period_start
  time_unit         = "MONTHLY"

  cost_filter {
    name = "Service"
    values = [
      "Amazon Elastic Container Service",
    ]
  }

  notification {
    comparison_operator       = "GREATER_THAN"
    threshold                 = 80
    threshold_type            = "PERCENTAGE"
    notification_type         = "ACTUAL"
    subscriber_sns_topic_arns = [aws_sns_topic.cost_alerts.arn]
  }

  notification {
    comparison_operator       = "GREATER_THAN"
    threshold                 = 100
    threshold_type            = "PERCENTAGE"
    notification_type         = "ACTUAL"
    subscriber_sns_topic_arns = [aws_sns_topic.cost_alerts.arn]
  }

  notification {
    comparison_operator       = "GREATER_THAN"
    threshold                 = 90
    threshold_type            = "PERCENTAGE"
    notification_type         = "FORECASTED"
    subscriber_sns_topic_arns = [aws_sns_topic.cost_alerts.arn]
  }

  lifecycle {
    # Temporarily disabled for deployment - will re-enable after apply
    # prevent_destroy = true
  }

  tags = {
    Name       = "${var.project_name}-ecs-budget-${var.environment}"
    CostCenter = var.cost_center
    Component  = "compute"
  }
}

resource "aws_budgets_budget" "rds_budget" {
  name              = "${var.project_name}-rds-budget-${var.environment}"
  budget_type       = "COST"
  limit_amount      = tostring(var.rds_budget_limit)
  limit_unit        = "USD"
  time_period_start = var.budget_time_period_start
  time_unit         = "MONTHLY"

  cost_filter {
    name = "Service"
    values = [
      "Amazon Relational Database Service",
    ]
  }

  notification {
    comparison_operator       = "GREATER_THAN"
    threshold                 = 80
    threshold_type            = "PERCENTAGE"
    notification_type         = "ACTUAL"
    subscriber_sns_topic_arns = [aws_sns_topic.cost_alerts.arn]
  }

  notification {
    comparison_operator       = "GREATER_THAN"
    threshold                 = 100
    threshold_type            = "PERCENTAGE"
    notification_type         = "ACTUAL"
    subscriber_sns_topic_arns = [aws_sns_topic.cost_alerts.arn]
  }

  notification {
    comparison_operator       = "GREATER_THAN"
    threshold                 = 90
    threshold_type            = "PERCENTAGE"
    notification_type         = "FORECASTED"
    subscriber_sns_topic_arns = [aws_sns_topic.cost_alerts.arn]
  }

  lifecycle {
    # Temporarily disabled for deployment - will re-enable after apply
    # prevent_destroy = true
  }

  tags = {
    Name       = "${var.project_name}-rds-budget-${var.environment}"
    CostCenter = var.cost_center
    Component  = "database"
  }
}

# Cost Anomaly Detection - Service Level
resource "aws_ce_anomaly_monitor" "service_monitor" {
  name              = "${var.project_name}-service-monitor-${var.environment}"
  monitor_type      = "DIMENSIONAL"
  monitor_dimension = "SERVICE"

  lifecycle {
    # Temporarily disabled for deployment - will re-enable after apply
    # prevent_destroy = true
  }

  tags = {
    Name       = "${var.project_name}-service-monitor-${var.environment}"
    CostCenter = var.cost_center
    Component  = "monitoring"
  }
}

# Cost Anomaly Detection - Linked Account
resource "aws_ce_anomaly_monitor" "account_monitor" {
  name         = "${var.project_name}-account-monitor-${var.environment}"
  monitor_type = "CUSTOM"

  monitor_specification = jsonencode({
    Tags = {
      Key    = "Project"
      Values = ["MANGU-Publishing"]
    }
  })

  lifecycle {
    # Temporarily disabled for deployment - will re-enable after apply
    # prevent_destroy = true
  }

  tags = {
    Name       = "${var.project_name}-account-monitor-${var.environment}"
    CostCenter = var.cost_center
    Component  = "monitoring"
  }
}

# Anomaly Alert Subscription with SNS
resource "aws_ce_anomaly_subscription" "anomaly_alerts" {
  name      = "${var.project_name}-anomaly-alerts-${var.environment}"
  frequency = "IMMEDIATE"

  monitor_arn_list = [
    aws_ce_anomaly_monitor.service_monitor.arn,
    aws_ce_anomaly_monitor.account_monitor.arn,
  ]

  subscriber {
    type    = "SNS"
    address = aws_sns_topic.cost_alerts.arn
  }

  threshold_expression {
    or {
      dimension {
        key           = "ANOMALY_TOTAL_IMPACT_ABSOLUTE"
        values        = [tostring(var.anomaly_absolute_threshold)]
        match_options = ["GREATER_THAN_OR_EQUAL"]
      }
    }
    or {
      dimension {
        key           = "ANOMALY_TOTAL_IMPACT_PERCENTAGE"
        values        = [tostring(var.anomaly_impact_threshold)]
        match_options = ["GREATER_THAN_OR_EQUAL"]
      }
    }
  }

  lifecycle {
    # Temporarily disabled for deployment - will re-enable after apply
    # prevent_destroy = true
  }

  tags = {
    Name       = "${var.project_name}-anomaly-alerts-${var.environment}"
    CostCenter = var.cost_center
    Component  = "monitoring"
  }
}

# CloudWatch Dashboard for Cost Monitoring
resource "aws_cloudwatch_dashboard" "cost_monitoring" {
  dashboard_name = "${var.project_name}-cost-dashboard-${var.environment}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Billing", "EstimatedCharges", { stat = "Maximum", label = "Total Estimated Charges" }]
          ]
          period = 21600
          stat   = "Maximum"
          region = "us-east-1"
          title  = "Estimated Monthly Charges"
          yAxis = {
            left = {
              min = 0
            }
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ECS", "CPUUtilization", { stat = "Average" }],
            [".", "MemoryUtilization", { stat = "Average" }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "ECS Resource Utilization"
          yAxis = {
            left = {
              min = 0
              max = 100
            }
          }
        }
      },
      {
        type = "log"
        properties = {
          query  = "SOURCE '/aws/cost/anomaly' | fields @timestamp, @message | sort @timestamp desc | limit 20"
          region = var.aws_region
          title  = "Recent Cost Anomalies"
        }
      }
    ]
  })
}

# Cost Allocation Tags (applied via default_tags in provider)
# Additional tag enforcement for cost tracking
locals {
  cost_allocation_tags = {
    Project     = "MANGU-Publishing"
    Environment = var.environment
    ManagedBy   = "Terraform"
    CostCenter  = var.cost_center
  }
}

# Outputs
output "sns_topic_arn" {
  description = "ARN of the cost alerts SNS topic"
  value       = aws_sns_topic.cost_alerts.arn
}

output "budget_name" {
  description = "Name of the monthly budget"
  value       = aws_budgets_budget.monthly.name
}

output "ecs_budget_name" {
  description = "Name of the ECS budget"
  value       = aws_budgets_budget.ecs_budget.name
}

output "rds_budget_name" {
  description = "Name of the RDS budget"
  value       = aws_budgets_budget.rds_budget.name
}

output "anomaly_monitor_arns" {
  description = "ARNs of cost anomaly monitors"
  value = {
    service = aws_ce_anomaly_monitor.service_monitor.arn
    account = aws_ce_anomaly_monitor.account_monitor.arn
  }
}

output "cost_dashboard_url" {
  description = "URL to the CloudWatch cost monitoring dashboard"
  value       = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.cost_monitoring.dashboard_name}"
}

output "cost_anomaly_subscription_arn" {
  description = "ARN of the cost anomaly subscription"
  value       = aws_ce_anomaly_subscription.anomaly_alerts.arn
}

output "billing_alert_email_count" {
  description = "Number of email subscriptions for billing alerts"
  value       = length(var.budget_alert_emails)
}
