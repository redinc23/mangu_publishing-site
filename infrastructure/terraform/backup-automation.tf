resource "aws_cloudwatch_event_rule" "daily_snapshot_copy" {
  name                = "${var.project_name}-daily-snapshot-copy-${var.environment}"
  description         = "Trigger daily RDS snapshot copy to DR region"
  schedule_expression = "cron(0 5 * * ? *)"

  tags = {
    Name = "${var.project_name}-daily-snapshot-copy-${var.environment}"
  }
}

resource "aws_cloudwatch_event_target" "snapshot_copy_lambda" {
  rule      = aws_cloudwatch_event_rule.daily_snapshot_copy.name
  target_id = "SnapshotCopyLambda"
  arn       = aws_lambda_function.snapshot_copy.arn
}

resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.snapshot_copy.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.daily_snapshot_copy.arn
}

resource "aws_iam_role" "snapshot_copy_lambda" {
  name = "${var.project_name}-snapshot-copy-lambda-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "snapshot_copy_lambda" {
  name = "${var.project_name}-snapshot-copy-policy-${var.environment}"
  role = aws_iam_role.snapshot_copy_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "rds:DescribeDBSnapshots",
          "rds:CopyDBSnapshot",
          "rds:DeleteDBSnapshot",
          "rds:ListTagsForResource",
          "rds:AddTagsToResource"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

data "archive_file" "snapshot_copy_lambda" {
  type        = "zip"
  output_path = "${path.module}/lambda_snapshot_copy.zip"

  source {
    content  = <<-EOT
      import boto3
      import os
      from datetime import datetime, timedelta

      rds_source = boto3.client('rds', region_name='us-east-1')
      rds_dr = boto3.client('rds', region_name='us-west-2')
      
      DB_INSTANCE = os.environ['DB_INSTANCE']
      RETENTION_DAYS = int(os.environ.get('RETENTION_DAYS', '7'))

      def lambda_handler(event, context):
          account_id = context.invoked_function_arn.split(':')[4]
          
          # Get latest automated snapshot
          snapshots = rds_source.describe_db_snapshots(
              DBInstanceIdentifier=DB_INSTANCE,
              SnapshotType='automated'
          )['DBSnapshots']
          
          if not snapshots:
              return {'statusCode': 404, 'body': 'No snapshots found'}
          
          latest = sorted(snapshots, key=lambda x: x['SnapshotCreateTime'])[-1]
          source_id = latest['DBSnapshotIdentifier']
          dr_id = f"{source_id}-dr-{datetime.now().strftime('%Y%m%d')}"
          
          # Check if already copied
          try:
              rds_dr.describe_db_snapshots(DBSnapshotIdentifier=dr_id)
              return {'statusCode': 200, 'body': f'Already copied: {dr_id}'}
          except rds_dr.exceptions.DBSnapshotNotFoundFault:
              pass
          
          # Copy snapshot
          source_arn = f"arn:aws:rds:us-east-1:{account_id}:snapshot:{source_id}"
          rds_dr.copy_db_snapshot(
              SourceDBSnapshotIdentifier=source_arn,
              TargetDBSnapshotIdentifier=dr_id,
              CopyTags=True,
              Tags=[
                  {'Key': 'CopiedFrom', 'Value': source_id},
                  {'Key': 'CopyDate', 'Value': datetime.now().strftime('%Y-%m-%d')},
                  {'Key': 'Purpose', 'Value': 'DisasterRecovery'}
              ]
          )
          
          # Cleanup old snapshots
          cutoff = datetime.now() - timedelta(days=RETENTION_DAYS)
          old_snapshots = rds_dr.describe_db_snapshots(SnapshotType='manual')['DBSnapshots']
          
          for snap in old_snapshots:
              if snap['DBSnapshotIdentifier'].startswith(f'rds:{DB_INSTANCE}'):
                  if snap['SnapshotCreateTime'].replace(tzinfo=None) < cutoff:
                      rds_dr.delete_db_snapshot(DBSnapshotIdentifier=snap['DBSnapshotIdentifier'])
          
          return {'statusCode': 200, 'body': f'Copied: {dr_id}'}
    EOT
    filename = "lambda_function.py"
  }
}

resource "aws_lambda_function" "snapshot_copy" {
  filename         = data.archive_file.snapshot_copy_lambda.output_path
  function_name    = "${var.project_name}-snapshot-copy-${var.environment}"
  role             = aws_iam_role.snapshot_copy_lambda.arn
  handler          = "lambda_function.lambda_handler"
  source_code_hash = data.archive_file.snapshot_copy_lambda.output_base64sha256
  runtime          = "python3.11"
  timeout          = 300

  environment {
    variables = {
      DB_INSTANCE    = "${var.project_name}-db-${var.environment}"
      RETENTION_DAYS = "7"
    }
  }

  tags = {
    Name = "${var.project_name}-snapshot-copy-${var.environment}"
  }
}

resource "aws_cloudwatch_log_group" "snapshot_copy_lambda" {
  name              = "/aws/lambda/${aws_lambda_function.snapshot_copy.function_name}"
  retention_in_days = 7

  tags = {
    Name = "${var.project_name}-snapshot-copy-logs-${var.environment}"
  }
}

output "snapshot_copy_lambda_arn" {
  description = "ARN of snapshot copy Lambda function"
  value       = aws_lambda_function.snapshot_copy.arn
}
