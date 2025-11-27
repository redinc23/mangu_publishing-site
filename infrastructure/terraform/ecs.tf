resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-cluster-${var.environment}"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name = "${var.project_name}-cluster-${var.environment}"
  }
}

resource "aws_ecs_cluster_capacity_providers" "main" {
  cluster_name       = aws_ecs_cluster.main.name
  capacity_providers = ["FARGATE", "FARGATE_SPOT"]

  default_capacity_provider_strategy {
    capacity_provider = "FARGATE"
    weight            = 1
    base              = 2
  }

  default_capacity_provider_strategy {
    capacity_provider = "FARGATE_SPOT"
    weight            = 4
  }
}

resource "aws_cloudwatch_log_group" "ecs_server" {
  name              = "/ecs/${var.project_name}-server-${var.environment}"
  retention_in_days = 30

  tags = {
    Name = "${var.project_name}-server-logs-${var.environment}"
  }
}

resource "aws_cloudwatch_log_group" "ecs_client" {
  name              = "/ecs/${var.project_name}-client-${var.environment}"
  retention_in_days = 30

  tags = {
    Name = "${var.project_name}-client-logs-${var.environment}"
  }
}

resource "aws_iam_role" "ecs_task_execution" {
  name = "${var.project_name}-ecs-task-execution-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })

  tags = {
    Name = "${var.project_name}-ecs-task-execution-${var.environment}"
  }
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy" "ecs_task_execution_secrets" {
  name = "${var.project_name}-ecs-secrets-${var.environment}"
  role = aws_iam_role.ecs_task_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          aws_secretsmanager_secret.db_credentials.arn,
          aws_secretsmanager_secret.redis_credentials.arn,
          aws_secretsmanager_secret.app_secrets.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "kms:ViaService" = "secretsmanager.${var.aws_region}.amazonaws.com"
          }
        }
      }
    ]
  })
}

resource "aws_iam_role" "ecs_task" {
  name = "${var.project_name}-ecs-task-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })

  tags = {
    Name = "${var.project_name}-ecs-task-${var.environment}"
  }
}

resource "aws_iam_role_policy" "ecs_task_s3" {
  name = "${var.project_name}-ecs-s3-${var.environment}"
  role = aws_iam_role.ecs_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = [
          "${aws_s3_bucket.uploads.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.uploads.arn
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy" "ecs_task_ses" {
  name = "${var.project_name}-ecs-ses-${var.environment}"
  role = aws_iam_role.ecs_task.id

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
          StringLike = {
            "ses:FromAddress" = "*@${var.domain_name}"
          }
        }
      }
    ]
  })
}

resource "aws_secretsmanager_secret" "app_secrets" {
  name        = "${var.project_name}-app-secrets-${var.environment}"
  description = "Application secrets for MANGU Publishing"

  tags = {
    Name = "${var.project_name}-app-secrets-${var.environment}"
  }
}

resource "aws_ecs_task_definition" "server" {
  family                   = "${var.project_name}-server-${var.environment}"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.ecs_server_cpu
  memory                   = var.ecs_server_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([{
    name  = "server"
    image = "${aws_ecr_repository.server.repository_url}:${var.image_tag}"

    essential = true

    portMappings = [{
      containerPort = 3000
      protocol      = "tcp"
    }]

    environment = [
      {
        name  = "NODE_ENV"
        value = "production"
      },
      {
        name  = "PORT"
        value = "3000"
      },
      {
        name  = "AWS_REGION"
        value = var.aws_region
      },
      {
        name  = "S3_UPLOADS_BUCKET"
        value = aws_s3_bucket.uploads.id
      },
      {
        name  = "CORS_ORIGINS"
        value = "https://${var.domain_name},https://www.${var.domain_name}"
      },
      {
        name  = "CLIENT_URL"
        value = "https://${var.domain_name}"
      }
    ]

    secrets = [
      {
        name      = "DATABASE_URL"
        valueFrom = "${aws_secretsmanager_secret.db_credentials.arn}:url::"
      },
      {
        name      = "REDIS_URL"
        valueFrom = "${aws_secretsmanager_secret.redis_credentials.arn}:url::"
      },
      {
        name      = "JWT_SECRET"
        valueFrom = "${aws_secretsmanager_secret.app_secrets.arn}:jwt_secret::"
      },
      {
        name      = "STRIPE_SECRET_KEY"
        valueFrom = "${aws_secretsmanager_secret.app_secrets.arn}:stripe_secret_key::"
      },
      {
        name      = "STRIPE_WEBHOOK_SECRET"
        valueFrom = "${aws_secretsmanager_secret.app_secrets.arn}:stripe_webhook_secret::"
      }
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.ecs_server.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }

    healthCheck = {
      command     = ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1"]
      interval    = 30
      timeout     = 5
      retries     = 3
      startPeriod = 60
    }
  }])

  tags = {
    Name = "${var.project_name}-server-task-${var.environment}"
  }
}

resource "aws_ecs_task_definition" "client" {
  family                   = "${var.project_name}-client-${var.environment}"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.ecs_client_cpu
  memory                   = var.ecs_client_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn

  container_definitions = jsonencode([{
    name  = "client"
    image = "${aws_ecr_repository.client.repository_url}:${var.image_tag}"

    essential = true

    portMappings = [{
      containerPort = 80
      protocol      = "tcp"
    }]

    environment = [
      {
        name  = "VITE_API_URL"
        value = "https://${var.domain_name}/api"
      }
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.ecs_client.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }

    healthCheck = {
      command     = ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost/ || exit 1"]
      interval    = 30
      timeout     = 5
      retries     = 3
      startPeriod = 30
    }
  }])

  tags = {
    Name = "${var.project_name}-client-task-${var.environment}"
  }
}

resource "aws_ecs_service" "server" {
  name            = "${var.project_name}-server-${var.environment}"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.server.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  enable_execute_command = true

  network_configuration {
    subnets         = aws_subnet.private[*].id
    security_groups = [aws_security_group.ecs_tasks.id]
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.server.arn
    container_name   = "server"
    container_port   = 3000
  }

  deployment_maximum_percent         = 200
  deployment_minimum_healthy_percent = 50

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  depends_on = [aws_lb_listener.https]

  tags = {
    Name = "${var.project_name}-server-service-${var.environment}"
  }
}

resource "aws_ecs_service" "client" {
  name            = "${var.project_name}-client-${var.environment}"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.client.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  enable_execute_command = true

  network_configuration {
    subnets         = aws_subnet.private[*].id
    security_groups = [aws_security_group.ecs_tasks.id]
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.client.arn
    container_name   = "client"
    container_port   = 80
  }

  deployment_maximum_percent         = 200
  deployment_minimum_healthy_percent = 50

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  depends_on = [aws_lb_listener.https]

  tags = {
    Name = "${var.project_name}-client-service-${var.environment}"
  }
}

resource "aws_appautoscaling_target" "server" {
  max_capacity       = 10
  min_capacity       = 2
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.server.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "server_cpu" {
  name               = "${var.project_name}-server-cpu-${var.environment}"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.server.resource_id
  scalable_dimension = aws_appautoscaling_target.server.scalable_dimension
  service_namespace  = aws_appautoscaling_target.server.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = 65.0
    scale_in_cooldown  = 600
    scale_out_cooldown = 120
  }
}

resource "aws_appautoscaling_policy" "server_memory" {
  name               = "${var.project_name}-server-memory-${var.environment}"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.server.resource_id
  scalable_dimension = aws_appautoscaling_target.server.scalable_dimension
  service_namespace  = aws_appautoscaling_target.server.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
    target_value       = 75.0
    scale_in_cooldown  = 600
    scale_out_cooldown = 120
  }
}

resource "aws_appautoscaling_target" "client" {
  max_capacity       = 6
  min_capacity       = 2
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.client.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "client_cpu" {
  name               = "${var.project_name}-client-cpu-${var.environment}"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.client.resource_id
  scalable_dimension = aws_appautoscaling_target.client.scalable_dimension
  service_namespace  = aws_appautoscaling_target.client.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = 65.0
    scale_in_cooldown  = 600
    scale_out_cooldown = 120
  }
}

resource "aws_appautoscaling_policy" "client_memory" {
  name               = "${var.project_name}-client-memory-${var.environment}"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.client.resource_id
  scalable_dimension = aws_appautoscaling_target.client.scalable_dimension
  service_namespace  = aws_appautoscaling_target.client.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
    target_value       = 75.0
    scale_in_cooldown  = 600
    scale_out_cooldown = 120
  }
}

resource "aws_appautoscaling_policy" "server_request_count" {
  name               = "${var.project_name}-server-request-count-${var.environment}"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.server.resource_id
  scalable_dimension = aws_appautoscaling_target.server.scalable_dimension
  service_namespace  = aws_appautoscaling_target.server.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ALBRequestCountPerTarget"
      resource_label         = "${aws_lb.main.arn_suffix}/${aws_lb_target_group.server.arn_suffix}"
    }
    target_value       = 1000.0
    scale_in_cooldown  = 600
    scale_out_cooldown = 120
  }
}

resource "aws_appautoscaling_scheduled_action" "server_scale_up_morning" {
  name               = "${var.project_name}-server-scale-up-morning-${var.environment}"
  service_namespace  = aws_appautoscaling_target.server.service_namespace
  resource_id        = aws_appautoscaling_target.server.resource_id
  scalable_dimension = aws_appautoscaling_target.server.scalable_dimension
  schedule           = "cron(0 13 * * ? *)"
  timezone           = "UTC"

  scalable_target_action {
    min_capacity = 3
    max_capacity = 10
  }
}

resource "aws_appautoscaling_scheduled_action" "server_scale_down_evening" {
  name               = "${var.project_name}-server-scale-down-evening-${var.environment}"
  service_namespace  = aws_appautoscaling_target.server.service_namespace
  resource_id        = aws_appautoscaling_target.server.resource_id
  scalable_dimension = aws_appautoscaling_target.server.scalable_dimension
  schedule           = "cron(0 2 * * ? *)"
  timezone           = "UTC"

  scalable_target_action {
    min_capacity = 2
    max_capacity = 10
  }
}

resource "aws_appautoscaling_scheduled_action" "client_scale_up_morning" {
  name               = "${var.project_name}-client-scale-up-morning-${var.environment}"
  service_namespace  = aws_appautoscaling_target.client.service_namespace
  resource_id        = aws_appautoscaling_target.client.resource_id
  scalable_dimension = aws_appautoscaling_target.client.scalable_dimension
  schedule           = "cron(0 13 * * ? *)"
  timezone           = "UTC"

  scalable_target_action {
    min_capacity = 3
    max_capacity = 6
  }
}

resource "aws_appautoscaling_scheduled_action" "client_scale_down_evening" {
  name               = "${var.project_name}-client-scale-down-evening-${var.environment}"
  service_namespace  = aws_appautoscaling_target.client.service_namespace
  resource_id        = aws_appautoscaling_target.client.resource_id
  scalable_dimension = aws_appautoscaling_target.client.scalable_dimension
  schedule           = "cron(0 2 * * ? *)"
  timezone           = "UTC"

  scalable_target_action {
    min_capacity = 2
    max_capacity = 6
  }
}

resource "aws_cloudwatch_metric_alarm" "server_cpu_high" {
  alarm_name          = "${var.project_name}-server-cpu-high-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 85
  alarm_description   = "Server CPU utilization is too high"
  treat_missing_data  = "notBreaching"

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.server.name
  }
}

resource "aws_cloudwatch_metric_alarm" "server_memory_high" {
  alarm_name          = "${var.project_name}-server-memory-high-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 90
  alarm_description   = "Server memory utilization is too high"
  treat_missing_data  = "notBreaching"

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.server.name
  }
}

resource "aws_cloudwatch_metric_alarm" "server_task_count_low" {
  alarm_name          = "${var.project_name}-server-task-count-low-${var.environment}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 1
  metric_name         = "RunningTaskCount"
  namespace           = "ECS/ContainerInsights"
  period              = 60
  statistic           = "Average"
  threshold           = 2
  alarm_description   = "Server running task count is below desired"
  treat_missing_data  = "breaching"

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.server.name
  }
}

resource "aws_cloudwatch_metric_alarm" "client_cpu_high" {
  alarm_name          = "${var.project_name}-client-cpu-high-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 85
  alarm_description   = "Client CPU utilization is too high"
  treat_missing_data  = "notBreaching"

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.client.name
  }
}

resource "aws_cloudwatch_metric_alarm" "alb_5xx_errors" {
  alarm_name          = "${var.project_name}-alb-5xx-errors-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "ALB 5xx errors are too high"
  treat_missing_data  = "notBreaching"

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }
}

resource "aws_cloudwatch_metric_alarm" "server_target_unhealthy" {
  alarm_name          = "${var.project_name}-server-target-unhealthy-${var.environment}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 1
  metric_name         = "HealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Average"
  threshold           = 1
  alarm_description   = "Server target group has no healthy targets"
  treat_missing_data  = "breaching"

  dimensions = {
    TargetGroup  = aws_lb_target_group.server.arn_suffix
    LoadBalancer = aws_lb.main.arn_suffix
  }
}

resource "aws_cloudwatch_metric_alarm" "client_target_unhealthy" {
  alarm_name          = "${var.project_name}-client-target-unhealthy-${var.environment}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 1
  metric_name         = "HealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Average"
  threshold           = 1
  alarm_description   = "Client target group has no healthy targets"
  treat_missing_data  = "breaching"

  dimensions = {
    TargetGroup  = aws_lb_target_group.client.arn_suffix
    LoadBalancer = aws_lb.main.arn_suffix
  }
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.main.name
}

output "app_secrets_arn" {
  description = "ARN of application secrets"
  value       = aws_secretsmanager_secret.app_secrets.arn
}
