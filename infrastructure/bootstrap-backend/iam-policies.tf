# IAM Policy for Terraform State Access
# This policy should be attached to the IAM user/role running Terraform

data "aws_caller_identity" "current" {}

resource "aws_iam_policy" "terraform_state_access" {
  name        = "TerraformStateAccess"
  description = "IAM policy for accessing Terraform state bucket and DynamoDB lock table"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ListStateBucket"
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.state.arn
      },
      {
        Sid    = "ReadWriteStateBucket"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = "${aws_s3_bucket.state.arn}/*"
      },
      {
        Sid    = "DynamoDBStateLocking"
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:DeleteItem"
        ]
        Resource = aws_dynamodb_table.state_locks.arn
      }
    ]
  })

  tags = var.default_tags
}

# Bucket policy to enforce encryption in transit
resource "aws_s3_bucket_policy" "state" {
  bucket = aws_s3_bucket.state.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "DenyUnencryptedObjectUploads"
        Effect = "Deny"
        Principal = "*"
        Action = "s3:PutObject"
        Resource = "${aws_s3_bucket.state.arn}/*"
        Condition = {
          StringNotEquals = {
            "s3:x-amz-server-side-encryption" = "AES256"
          }
        }
      },
      {
        Sid    = "DenyInsecureTransport"
        Effect = "Deny"
        Principal = "*"
        Action = "s3:*"
        Resource = [
          aws_s3_bucket.state.arn,
          "${aws_s3_bucket.state.arn}/*"
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

output "iam_policy_arn" {
  description = "ARN of the IAM policy for Terraform state access"
  value       = aws_iam_policy.terraform_state_access.arn
}

output "iam_policy_attachment_command" {
  description = "AWS CLI command to attach the policy to a user/role"
  value       = "aws iam attach-user-policy --user-name YOUR_USERNAME --policy-arn ${aws_iam_policy.terraform_state_access.arn}"
}
