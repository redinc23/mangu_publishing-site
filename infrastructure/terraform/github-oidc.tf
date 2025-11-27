# GitHub OIDC Provider for Secure CI/CD
# Enables GitHub Actions to assume AWS roles without long-lived credentials

# ========================================
# GitHub OIDC Provider
# ========================================
resource "aws_iam_openid_connect_provider" "github_actions" {
  url = "https://token.actions.githubusercontent.com"

  client_id_list = [
    "sts.amazonaws.com",
  ]

  thumbprint_list = [
    "6938fd4d98bab03faadb97b34396831e3780aea1",
    "1c58a3a8518e8759bf075b76b750d4f2df264fcd"
  ]

  tags = {
    Name        = "${var.project_name}-${var.environment}-github-oidc"
    Environment = var.environment
    ManagedBy   = "terraform"
    Purpose     = "github-actions-authentication"
  }
}

# ========================================
# Trust Policy for GitHub Actions
# ========================================
data "aws_iam_policy_document" "github_actions_assume_role" {
  statement {
    effect = "Allow"

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github_actions.arn]
    }

    actions = ["sts:AssumeRoleWithWebIdentity"]

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:${var.github_org}/${var.github_repo}:*"]
    }
  }
}

# ========================================
# GitHub Actions Deployment Role
# ========================================
# Note: This role is already defined in iam.tf, but we update the trust policy here
resource "aws_iam_role_policy_attachment" "github_actions_ecr" {
  role       = aws_iam_role.github_actions_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPowerUser"
}

# ========================================
# Outputs
# ========================================
output "github_oidc_provider_arn" {
  value       = aws_iam_openid_connect_provider.github_actions.arn
  description = "ARN of GitHub OIDC provider"
}

output "github_actions_role_instruction" {
  value       = <<-EOT
    To use this role in GitHub Actions, add the following to your workflow:

    permissions:
      id-token: write
      contents: read

    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v4
      with:
        role-to-assume: ${aws_iam_role.github_actions_role.arn}
        aws-region: ${var.aws_region}
  EOT
  description = "Instructions for using GitHub Actions role"
}
