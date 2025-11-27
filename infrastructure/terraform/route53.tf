# ============================================================================
# Route53 Hosted Zone and DNS Records
# ============================================================================
# This module creates a Route53 hosted zone for the domain and configures
# DNS records to point to CloudFront distribution. It also provides outputs
# for name servers that need to be configured at the domain registrar.
# ============================================================================

# Route53 Hosted Zone
resource "aws_route53_zone" "main" {
  name = var.domain_name

  tags = {
    Name        = "${var.project_name}-zone-${var.environment}"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }
}

# DNS A Record (Alias) for root domain pointing to CloudFront
resource "aws_route53_record" "root" {
  zone_id = aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.main.domain_name
    zone_id                = aws_cloudfront_distribution.main.hosted_zone_id
    evaluate_target_health = false
  }
}

# DNS A Record (Alias) for www subdomain pointing to CloudFront
resource "aws_route53_record" "www" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "www.${var.domain_name}"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.main.domain_name
    zone_id                = aws_cloudfront_distribution.main.hosted_zone_id
    evaluate_target_health = false
  }
}

# ============================================================================
# Outputs
# ============================================================================

output "route53_zone_id" {
  description = "Route53 hosted zone ID"
  value       = aws_route53_zone.main.zone_id
}

output "route53_name_servers" {
  description = "Route53 name servers - update these at your domain registrar"
  value       = aws_route53_zone.main.name_servers
}

output "route53_zone_name" {
  description = "Route53 hosted zone name"
  value       = aws_route53_zone.main.name
}

output "dns_records_status" {
  description = "Status of DNS records"
  value = {
    root_domain = aws_route53_record.root.fqdn
    www_domain  = aws_route53_record.www.fqdn
    cloudfront  = aws_cloudfront_distribution.main.domain_name
  }
}



