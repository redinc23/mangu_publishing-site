# ============================================================================
# ACM Certificate Automation - CloudFront & ALB
# ============================================================================
# This module automates ACM certificate creation for both CloudFront (requires
# us-east-1) and ALB (regional). DNS validation records are surfaced as outputs
# for manual DNS configuration when Route53 is not managed by Terraform.
#
# Workflow:
# 1. terraform apply → creates certificates, outputs DNS validation records
# 2. Add CNAME records to your DNS provider
# 3. terraform apply → waits for ISSUED status, then creates dependent resources
# ============================================================================

# CloudFront Certificate (MUST be in us-east-1)
resource "aws_acm_certificate" "main" {
  count             = var.create_acm_certificate ? 1 : 0
  provider          = aws.us_east_1
  domain_name       = var.domain_name
  validation_method = "DNS"

  subject_alternative_names = [
    "www.${var.domain_name}",
    "*.${var.domain_name}"
  ]

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name        = "${var.project_name}-cloudfront-cert-${var.environment}"
    Environment = var.environment
    Purpose     = "CloudFront SSL/TLS"
  }
}

# ALB Regional Certificate (same region as ALB - typically us-east-1)
resource "aws_acm_certificate" "alb" {
  count             = var.create_acm_certificate ? 1 : 0
  domain_name       = var.domain_name
  validation_method = "DNS"

  subject_alternative_names = [
    "www.${var.domain_name}",
    "*.${var.domain_name}"
  ]

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name        = "${var.project_name}-alb-cert-${var.environment}"
    Environment = var.environment
    Purpose     = "ALB HTTPS Listener"
  }
}

# ============================================================================
# Route53 DNS Validation (AUTOMATED - uses Route53 zone resource)
# ============================================================================

# Route53 records for CloudFront certificate DNS validation
resource "aws_route53_record" "cert_validation" {
  for_each = var.create_acm_certificate ? {
    for dvo in aws_acm_certificate.main[0].domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  } : {}

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = aws_route53_zone.main.zone_id
}

# Route53 records for ALB certificate DNS validation
resource "aws_route53_record" "alb_cert_validation" {
  for_each = var.create_acm_certificate ? {
    for dvo in aws_acm_certificate.alb[0].domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  } : {}

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = aws_route53_zone.main.zone_id
}

# ============================================================================
# Certificate Validation Resources
# ============================================================================
# These resources wait for certificate status = "ISSUED" before allowing
# dependent resources (CloudFront, ALB) to proceed. If Route53 is managed,
# validation is automatic. Otherwise, validation waits until DNS records are
# manually added and propagated.

# CloudFront Certificate Validation
resource "aws_acm_certificate_validation" "main" {
  count                   = var.create_acm_certificate ? 1 : 0
  provider                = aws.us_east_1
  certificate_arn         = aws_acm_certificate.main[0].arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]

  timeouts {
    create = "30m"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# ALB Certificate Validation
resource "aws_acm_certificate_validation" "alb" {
  count                   = var.create_acm_certificate ? 1 : 0
  certificate_arn         = aws_acm_certificate.alb[0].arn
  validation_record_fqdns = [for record in aws_route53_record.alb_cert_validation : record.fqdn]

  timeouts {
    create = "30m"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# ============================================================================
# Outputs - Critical for Manual DNS Configuration
# ============================================================================

output "certificate_arn" {
  description = "ARN of the validated CloudFront ACM certificate (use this in CloudFront)"
  value       = var.create_acm_certificate ? aws_acm_certificate_validation.main[0].certificate_arn : var.certificate_arn
}

output "alb_certificate_arn" {
  description = "ARN of the validated ALB ACM certificate (use this in ALB HTTPS listener)"
  value       = var.create_acm_certificate ? aws_acm_certificate_validation.alb[0].certificate_arn : var.certificate_arn
}

output "cloudfront_certificate_status" {
  description = "Status of CloudFront certificate (PENDING_VALIDATION, ISSUED, etc.)"
  value       = var.create_acm_certificate ? aws_acm_certificate.main[0].status : "USING_EXISTING_CERTIFICATE"
}

output "alb_certificate_status" {
  description = "Status of ALB certificate (PENDING_VALIDATION, ISSUED, etc.)"
  value       = var.create_acm_certificate ? aws_acm_certificate.alb[0].status : "USING_EXISTING_CERTIFICATE"
}

# DNS Validation Records for Manual Configuration
output "cloudfront_dns_validation_records" {
  description = <<-EOT
    DNS CNAME records required for CloudFront certificate validation.
    Add these records to your DNS provider, then re-run terraform apply.
    
    Example:
      Name:  _abc123.mangu-publishing.com
      Type:  CNAME
      Value: _xyz456.acm-validations.aws.
      TTL:   300
  EOT
  value = var.create_acm_certificate ? [
    for dvo in aws_acm_certificate.main[0].domain_validation_options : {
      domain_name = dvo.domain_name
      name        = dvo.resource_record_name
      type        = dvo.resource_record_type
      value       = dvo.resource_record_value
      instruction = "Add CNAME: ${dvo.resource_record_name} → ${dvo.resource_record_value}"
    }
  ] : []
}

output "alb_dns_validation_records" {
  description = <<-EOT
    DNS CNAME records required for ALB certificate validation.
    Add these records to your DNS provider, then re-run terraform apply.
  EOT
  value = var.create_acm_certificate ? [
    for dvo in aws_acm_certificate.alb[0].domain_validation_options : {
      domain_name = dvo.domain_name
      name        = dvo.resource_record_name
      type        = dvo.resource_record_type
      value       = dvo.resource_record_value
      instruction = "Add CNAME: ${dvo.resource_record_name} → ${dvo.resource_record_value}"
    }
  ] : []
}

# Consolidated validation instructions
output "acm_validation_instructions" {
  description = "Step-by-step instructions for ACM certificate validation"
  value       = var.create_acm_certificate ? "ACM certificates use automated Route53 validation via aws_route53_zone.main" : "Using existing certificate_arn"
}
