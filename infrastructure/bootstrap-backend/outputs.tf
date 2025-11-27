output "state_bucket_name" {
  description = "Name of the S3 bucket that stores Terraform state"
  value       = aws_s3_bucket.state.bucket
}

output "state_bucket_arn" {
  description = "ARN of the S3 bucket that stores Terraform state"
  value       = aws_s3_bucket.state.arn
}

output "dynamodb_table_name" {
  description = "Name of the DynamoDB table used for Terraform state locking"
  value       = aws_dynamodb_table.state_locks.name
}

output "dynamodb_table_arn" {
  description = "ARN of the DynamoDB table used for Terraform state locking"
  value       = aws_dynamodb_table.state_locks.arn
}

output "backend_config" {
  description = "Backend configuration for main Terraform"
  value = {
    bucket         = aws_s3_bucket.state.bucket
    key            = "production/terraform.tfstate"
    region         = var.aws_region
    encrypt        = true
    dynamodb_table = aws_dynamodb_table.state_locks.name
  }
}
