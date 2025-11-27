variable "aws_region" {
  description = "AWS region where the backend resources should live (must match the main Terraform backend region)."
  type        = string
  default     = "us-east-1"
}

variable "state_bucket_name" {
  description = "Name of the S3 bucket that will store Terraform state."
  type        = string
  default     = "mangu-terraform-state"
}

variable "dynamodb_table_name" {
  description = "Name of the DynamoDB table for Terraform state locking."
  type        = string
  default     = "mangu-terraform-locks"
}

variable "default_tags" {
  description = "Tags to apply to backend resources."
  type        = map(string)
  default = {
    Project   = "MANGU-Publishing"
    ManagedBy = "Terraform"
  }
}

