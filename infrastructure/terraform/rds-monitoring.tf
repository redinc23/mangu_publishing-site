# ================================================================
# RDS Performance Monitoring and Alerting
# ================================================================

# CloudWatch Alarms for RDS Performance Metrics
resource "aws_cloudwatch_metric_alarm" "rds_cpu" {
  alarm_name          = "${var.project_name}-rds-high-cpu-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors RDS CPU utilization"
  alarm_actions       = [aws_sns_topic.rds_alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  tags = {
    Name        = "${var.project_name}-rds-high-cpu-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_cloudwatch_metric_alarm" "rds_memory" {
  alarm_name          = "${var.project_name}-rds-low-memory-${var.environment}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "FreeableMemory"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "536870912" # 512MB
  alarm_description   = "This metric monitors RDS available memory"
  alarm_actions       = [aws_sns_topic.rds_alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  tags = {
    Name        = "${var.project_name}-rds-low-memory-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_cloudwatch_metric_alarm" "rds_storage" {
  alarm_name          = "${var.project_name}-rds-low-storage-${var.environment}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "5368709120" # 5GB
  alarm_description   = "This metric monitors RDS available storage"
  alarm_actions       = [aws_sns_topic.rds_alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  tags = {
    Name        = "${var.project_name}-rds-low-storage-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_cloudwatch_metric_alarm" "rds_connections" {
  alarm_name          = "${var.project_name}-rds-high-connections-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "180" # 90% of max_connections (200)
  alarm_description   = "This metric monitors RDS connection count"
  alarm_actions       = [aws_sns_topic.rds_alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  tags = {
    Name        = "${var.project_name}-rds-high-connections-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_cloudwatch_metric_alarm" "rds_read_latency" {
  alarm_name          = "${var.project_name}-rds-high-read-latency-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "3"
  metric_name         = "ReadLatency"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "0.1" # 100ms
  alarm_description   = "This metric monitors RDS read latency"
  alarm_actions       = [aws_sns_topic.rds_alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  tags = {
    Name        = "${var.project_name}-rds-high-read-latency-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_cloudwatch_metric_alarm" "rds_write_latency" {
  alarm_name          = "${var.project_name}-rds-high-write-latency-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "3"
  metric_name         = "WriteLatency"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "0.1" # 100ms
  alarm_description   = "This metric monitors RDS write latency"
  alarm_actions       = [aws_sns_topic.rds_alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  tags = {
    Name        = "${var.project_name}-rds-high-write-latency-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_cloudwatch_metric_alarm" "rds_replication_lag" {
  count = var.environment == "production" && var.enable_read_replica ? 1 : 0

  alarm_name          = "${var.project_name}-rds-high-replication-lag-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ReplicaLag"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "1000" # 1 second
  alarm_description   = "This metric monitors RDS replication lag"
  alarm_actions       = [aws_sns_topic.rds_alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.read_replica[0].id
  }

  tags = {
    Name        = "${var.project_name}-rds-high-replication-lag-${var.environment}"
    Environment = var.environment
  }
}

# SNS Topic for RDS Alerts
resource "aws_sns_topic" "rds_alerts" {
  name = "${var.project_name}-rds-alerts-${var.environment}"

  tags = {
    Name        = "${var.project_name}-rds-alerts-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_sns_topic_subscription" "rds_alerts_email" {
  count     = length(var.budget_alert_emails)
  topic_arn = aws_sns_topic.rds_alerts.arn
  protocol  = "email"
  endpoint  = var.budget_alert_emails[count.index]
}

# CloudWatch Dashboard for RDS Performance
resource "aws_cloudwatch_dashboard" "rds_performance" {
  dashboard_name = "${var.project_name}-rds-${var.environment}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "CPUUtilization", { stat = "Average", label = "CPU Utilization" }],
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "CPU Utilization"
          yAxis = {
            left = {
              min = 0
              max = 100
            }
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "DatabaseConnections", { stat = "Average", label = "Connections" }],
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "Database Connections"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "ReadLatency", { stat = "Average", label = "Read Latency" }],
            [".", "WriteLatency", { stat = "Average", label = "Write Latency" }],
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "I/O Latency"
          yAxis = {
            left = {
              label = "Seconds"
            }
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "ReadThroughput", { stat = "Average", label = "Read" }],
            [".", "WriteThroughput", { stat = "Average", label = "Write" }],
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "I/O Throughput"
          yAxis = {
            left = {
              label = "Bytes/Second"
            }
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "FreeStorageSpace", { stat = "Average", label = "Free Storage" }],
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "Storage"
          yAxis = {
            left = {
              label = "Bytes"
            }
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "FreeableMemory", { stat = "Average", label = "Freeable Memory" }],
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "Memory"
          yAxis = {
            left = {
              label = "Bytes"
            }
          }
        }
      }
    ]
  })
}

# Output
output "rds_monitoring_dashboard_url" {
  description = "URL to RDS CloudWatch dashboard"
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.rds_performance.dashboard_name}"
}

output "rds_alerts_topic_arn" {
  description = "ARN of SNS topic for RDS alerts"
  value       = aws_sns_topic.rds_alerts.arn
}
