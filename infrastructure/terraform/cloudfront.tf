# WAF Web ACL with OWASP Top 10 ruleset
resource "aws_wafv2_web_acl" "cloudfront" {
  name  = "${var.project_name}-cloudfront-waf-${var.environment}"
  scope = "CLOUDFRONT"

  default_action {
    allow {}
  }

  # AWS Managed Rule - Core Rule Set (CRS) - OWASP Top 10
  rule {
    name     = "AWS-AWSManagedRulesCommonRuleSet"
    priority = 1

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        vendor_name = "AWS"
        name        = "AWSManagedRulesCommonRuleSet"

        rule_action_override {
          name = "SizeRestrictions_BODY"
          action_to_use {
            count {}
          }
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedRulesCommonRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  # AWS Managed Rule - Known Bad Inputs
  rule {
    name     = "AWS-AWSManagedRulesKnownBadInputsRuleSet"
    priority = 2

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        vendor_name = "AWS"
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedRulesKnownBadInputsRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  # AWS Managed Rule - SQL Injection Protection
  rule {
    name     = "AWS-AWSManagedRulesSQLiRuleSet"
    priority = 3

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        vendor_name = "AWS"
        name        = "AWSManagedRulesSQLiRuleSet"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedRulesSQLiRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  # AWS Managed Rule - Linux Operating System Protection
  rule {
    name     = "AWS-AWSManagedRulesLinuxRuleSet"
    priority = 4

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        vendor_name = "AWS"
        name        = "AWSManagedRulesLinuxRuleSet"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedRulesLinuxRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  # Rate limiting rule - 2000 requests per 5 minutes per IP
  rule {
    name     = "RateLimitRule"
    priority = 5

    action {
      block {
        custom_response {
          response_code            = 429
          custom_response_body_key = "rate_limit_response"
        }
      }
    }

    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimitRuleMetric"
      sampled_requests_enabled   = true
    }
  }

  # Geo-blocking rule (optional, controlled by variable)
  dynamic "rule" {
    for_each = var.enable_geo_blocking ? [1] : []
    content {
      name     = "GeoBlockRule"
      priority = 6

      action {
        block {}
      }

      statement {
        geo_match_statement {
          country_codes = var.blocked_countries
        }
      }

      visibility_config {
        cloudwatch_metrics_enabled = true
        metric_name                = "GeoBlockRuleMetric"
        sampled_requests_enabled   = true
      }
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${var.project_name}-cloudfront-waf-${var.environment}"
    sampled_requests_enabled   = true
  }

  custom_response_body {
    key          = "rate_limit_response"
    content      = "{\"error\": \"Rate limit exceeded. Please try again later.\"}"
    content_type = "APPLICATION_JSON"
  }

  tags = {
    Name        = "${var.project_name}-cloudfront-waf-${var.environment}"
    Environment = var.environment
  }
}

# Origin Access Control for S3
resource "aws_cloudfront_origin_access_control" "main" {
  name                              = "${var.project_name}-oac-${var.environment}"
  description                       = "OAC for MANGU Publishing static assets"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# Cache Policy - Static Assets (long-lived immutable content)
resource "aws_cloudfront_cache_policy" "static_assets" {
  name        = "${var.project_name}-static-cache-${var.environment}"
  comment     = "Cache policy for static assets with long TTL"
  default_ttl = 86400    # 1 day
  max_ttl     = 31536000 # 1 year
  min_ttl     = 3600     # 1 hour

  parameters_in_cache_key_and_forwarded_to_origin {
    cookies_config {
      cookie_behavior = "none"
    }
    headers_config {
      header_behavior = "whitelist"
      headers {
        items = ["Accept", "Accept-Encoding"]
      }
    }
    query_strings_config {
      query_string_behavior = "none"
    }
    enable_accept_encoding_gzip   = true
    enable_accept_encoding_brotli = true
  }
}

# Cache Policy - Dynamic Content with versioning
resource "aws_cloudfront_cache_policy" "dynamic_content" {
  name        = "${var.project_name}-dynamic-cache-${var.environment}"
  comment     = "Cache policy for user uploads with query string versioning"
  default_ttl = 3600  # 1 hour
  max_ttl     = 86400 # 1 day
  min_ttl     = 0

  parameters_in_cache_key_and_forwarded_to_origin {
    cookies_config {
      cookie_behavior = "none"
    }
    headers_config {
      header_behavior = "whitelist"
      headers {
        items = ["Accept", "Accept-Encoding", "CloudFront-Viewer-Country"]
      }
    }
    query_strings_config {
      query_string_behavior = "whitelist"
      query_strings {
        items = ["v", "version", "timestamp"]
      }
    }
    enable_accept_encoding_gzip   = true
    enable_accept_encoding_brotli = true
  }
}

# Origin Request Policy - API requests (pass all headers and cookies)
resource "aws_cloudfront_origin_request_policy" "api" {
  name    = "${var.project_name}-api-origin-${var.environment}"
  comment = "Origin request policy for API with all headers and cookies"

  cookies_config {
    cookie_behavior = "all"
  }

  headers_config {
    header_behavior = "allViewerAndWhitelistCloudFront"
    headers {
      items = [
        "CloudFront-Viewer-Country",
        "CloudFront-Viewer-Country-Region",
        "CloudFront-Is-Mobile-Viewer",
        "CloudFront-Is-Desktop-Viewer",
        "CloudFront-Is-Tablet-Viewer"
      ]
    }
  }

  query_strings_config {
    query_string_behavior = "all"
  }
}

# Response Headers Policy - Security headers
resource "aws_cloudfront_response_headers_policy" "security_headers" {
  name    = "${var.project_name}-security-headers-${var.environment}"
  comment = "Security headers policy with OWASP best practices"

  security_headers_config {
    content_type_options {
      override = true
    }

    frame_options {
      frame_option = "DENY"
      override     = true
    }

    referrer_policy {
      referrer_policy = "strict-origin-when-cross-origin"
      override        = true
    }

    strict_transport_security {
      access_control_max_age_sec = 31536000
      include_subdomains         = true
      preload                    = true
      override                   = true
    }

    xss_protection {
      mode_block = true
      protection = true
      override   = true
    }

    content_security_policy {
      content_security_policy = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://*.amazonaws.com; frame-ancestors 'none';"
      override                = true
    }
  }

  custom_headers_config {
    items {
      header   = "Permissions-Policy"
      value    = "geolocation=(), microphone=(), camera=(), payment=()"
      override = true
    }

    items {
      header   = "X-Content-Type-Options"
      value    = "nosniff"
      override = true
    }
  }

  cors_config {
    access_control_allow_origins {
      items = ["https://${var.domain_name}", "https://www.${var.domain_name}"]
    }

    access_control_allow_headers {
      items = ["*"]
    }

    access_control_allow_methods {
      items = ["GET", "HEAD", "OPTIONS", "POST", "PUT", "DELETE"]
    }

    access_control_allow_credentials = true
    access_control_max_age_sec       = 86400
    origin_override                  = true
  }
}

resource "aws_cloudfront_distribution" "main" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "MANGU Publishing CDN with WAF protection"
  default_root_object = "index.html"
  price_class         = "PriceClass_100"
  aliases             = [var.domain_name, "www.${var.domain_name}"]
  web_acl_id          = aws_wafv2_web_acl.cloudfront.arn
  http_version        = "http2and3"

  # S3 Origin - Static Assets (app bundles, CSS, JS)
  origin {
    domain_name              = aws_s3_bucket.static_assets.bucket_regional_domain_name
    origin_id                = "S3-static"
    origin_access_control_id = aws_cloudfront_origin_access_control.main.id

    origin_shield {
      enabled              = var.enable_origin_shield
      origin_shield_region = var.aws_region
    }
  }

  # S3 Origin - User Uploads (book covers, author photos)
  origin {
    domain_name              = aws_s3_bucket.uploads.bucket_regional_domain_name
    origin_id                = "S3-uploads"
    origin_access_control_id = aws_cloudfront_origin_access_control.main.id

    origin_shield {
      enabled              = var.enable_origin_shield
      origin_shield_region = var.aws_region
    }
  }

  # ALB Origin - API and dynamic content
  origin {
    domain_name = aws_lb.main.dns_name
    origin_id   = "ALB"

    custom_origin_config {
      http_port                = 80
      https_port               = 443
      origin_protocol_policy   = "https-only"
      origin_ssl_protocols     = ["TLSv1.2"]
      origin_keepalive_timeout = 60
      origin_read_timeout      = 60
    }

    custom_header {
      name  = "X-Origin-Verify"
      value = var.origin_verify_secret
    }

    origin_shield {
      enabled              = var.enable_origin_shield
      origin_shield_region = var.aws_region
    }
  }

  # Default behavior - Static assets from S3
  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = "S3-static"

    cache_policy_id            = aws_cloudfront_cache_policy.static_assets.id
    response_headers_policy_id = aws_cloudfront_response_headers_policy.security_headers.id
    compress                   = true
    viewer_protocol_policy     = "redirect-to-https"

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.url_rewrite.arn
    }
  }

  # API behavior - No caching, pass all headers
  ordered_cache_behavior {
    path_pattern     = "/api/*"
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = "ALB"

    origin_request_policy_id   = aws_cloudfront_origin_request_policy.api.id
    response_headers_policy_id = aws_cloudfront_response_headers_policy.security_headers.id
    compress                   = true
    viewer_protocol_policy     = "https-only"

    # No caching for API requests
    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 0

    forwarded_values {
      query_string = true
      headers      = ["*"]
      cookies {
        forward = "all"
      }
    }
  }

  # Static assets behavior (CSS, JS, fonts)
  ordered_cache_behavior {
    path_pattern     = "/assets/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = "S3-static"

    cache_policy_id            = aws_cloudfront_cache_policy.static_assets.id
    response_headers_policy_id = aws_cloudfront_response_headers_policy.security_headers.id
    compress                   = true
    viewer_protocol_policy     = "redirect-to-https"
  }

  # User uploads behavior (book covers, images with versioning)
  ordered_cache_behavior {
    path_pattern     = "/static/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = "S3-uploads"

    cache_policy_id            = aws_cloudfront_cache_policy.dynamic_content.id
    response_headers_policy_id = aws_cloudfront_response_headers_policy.security_headers.id
    compress                   = true
    viewer_protocol_policy     = "redirect-to-https"
  }

  # Uploads path behavior (for direct S3 uploads)
  ordered_cache_behavior {
    path_pattern     = "/uploads/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = "S3-uploads"

    cache_policy_id            = aws_cloudfront_cache_policy.dynamic_content.id
    response_headers_policy_id = aws_cloudfront_response_headers_policy.security_headers.id
    compress                   = true
    viewer_protocol_policy     = "redirect-to-https"
  }

  # Custom error responses with branded error pages
  custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 10
  }

  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 10
  }

  custom_error_response {
    error_code            = 500
    response_code         = 500
    response_page_path    = "/error.html"
    error_caching_min_ttl = 0
  }

  custom_error_response {
    error_code            = 502
    response_code         = 502
    response_page_path    = "/error.html"
    error_caching_min_ttl = 0
  }

  custom_error_response {
    error_code            = 503
    response_code         = 503
    response_page_path    = "/maintenance.html"
    error_caching_min_ttl = 0
  }

  custom_error_response {
    error_code            = 504
    response_code         = 504
    response_page_path    = "/error.html"
    error_caching_min_ttl = 0
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = var.create_acm_certificate ? aws_acm_certificate_validation.main[0].certificate_arn : var.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  logging_config {
    include_cookies = false
    bucket          = aws_s3_bucket.cloudfront_logs.bucket_domain_name
    prefix          = "cloudfront/"
  }

  tags = {
    Name        = "${var.project_name}-cdn-${var.environment}"
    Environment = var.environment
  }
}

# CloudFront Function for URL rewriting (SPA routing)
resource "aws_cloudfront_function" "url_rewrite" {
  name    = "${var.project_name}-url-rewrite-${var.environment}"
  runtime = "cloudfront-js-1.0"
  comment = "URL rewrite for SPA routing"
  publish = true
  code    = file("${path.module}/functions/url-rewrite.js")
}

# S3 bucket for CloudFront logs
resource "aws_s3_bucket" "cloudfront_logs" {
  bucket = "${var.project_name}-cloudfront-logs-${var.environment}"

  tags = {
    Name        = "${var.project_name}-cloudfront-logs-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_s3_bucket_ownership_controls" "cloudfront_logs" {
  bucket = aws_s3_bucket.cloudfront_logs.id

  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_acl" "cloudfront_logs" {
  depends_on = [aws_s3_bucket_ownership_controls.cloudfront_logs]
  bucket     = aws_s3_bucket.cloudfront_logs.id
  acl        = "private"
}

resource "aws_s3_bucket_lifecycle_configuration" "cloudfront_logs" {
  bucket = aws_s3_bucket.cloudfront_logs.id

  rule {
    id     = "expire-logs"
    status = "Enabled"

    filter {}

    expiration {
      days = 90
    }

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "cloudfront_logs" {
  bucket = aws_s3_bucket.cloudfront_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Archive Lambda source for cache invalidation
data "archive_file" "cache_invalidation" {
  type        = "zip"
  source_dir  = "${path.module}/lambda"
  output_path = "${path.module}/lambda/.build/cache-invalidation.zip"
  excludes    = ["cache-invalidation.zip", ".build"]
}

# Lambda function for cache invalidation
resource "aws_lambda_function" "cache_invalidation" {
  filename         = data.archive_file.cache_invalidation.output_path
  function_name    = "${var.project_name}-cache-invalidation-${var.environment}"
  role             = aws_iam_role.cache_invalidation.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.cache_invalidation.output_base64sha256
  runtime          = "nodejs18.x"
  timeout          = 60

  environment {
    variables = {
      DISTRIBUTION_ID = aws_cloudfront_distribution.main.id
      ENVIRONMENT     = var.environment
    }
  }

  tags = {
    Name        = "${var.project_name}-cache-invalidation-${var.environment}"
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_iam_role" "cache_invalidation" {
  name = "${var.project_name}-cache-invalidation-${var.environment}"

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

  tags = {
    Name        = "${var.project_name}-cache-invalidation-role-${var.environment}"
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_iam_role_policy" "cache_invalidation" {
  name = "${var.project_name}-cache-invalidation-policy-${var.environment}"
  role = aws_iam_role.cache_invalidation.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cloudfront:CreateInvalidation",
          "cloudfront:GetInvalidation",
          "cloudfront:ListInvalidations"
        ]
        Resource = aws_cloudfront_distribution.main.arn
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

# SNS topic for cache invalidation events
resource "aws_sns_topic" "cache_invalidation" {
  name = "${var.project_name}-cache-invalidation-${var.environment}"

  tags = {
    Name        = "${var.project_name}-cache-invalidation-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_sns_topic_subscription" "cache_invalidation" {
  topic_arn = aws_sns_topic.cache_invalidation.arn
  protocol  = "lambda"
  endpoint  = aws_lambda_function.cache_invalidation.arn
}

resource "aws_lambda_permission" "cache_invalidation" {
  statement_id  = "AllowExecutionFromSNS"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.cache_invalidation.function_name
  principal     = "sns.amazonaws.com"
  source_arn    = aws_sns_topic.cache_invalidation.arn
}

# CloudWatch alarms for WAF
resource "aws_cloudwatch_metric_alarm" "waf_blocked_requests" {
  alarm_name          = "${var.project_name}-waf-blocked-requests-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "BlockedRequests"
  namespace           = "AWS/WAFV2"
  period              = 300
  statistic           = "Sum"
  threshold           = 1000
  alarm_description   = "This metric monitors WAF blocked requests"
  treat_missing_data  = "notBreaching"

  dimensions = {
    WebACL = aws_wafv2_web_acl.cloudfront.name
    Region = "us-east-1"
    Rule   = "ALL"
  }

  tags = {
    Name        = "${var.project_name}-waf-blocked-requests-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_cloudwatch_metric_alarm" "cloudfront_4xx_errors" {
  alarm_name          = "${var.project_name}-cloudfront-4xx-errors-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "4xxErrorRate"
  namespace           = "AWS/CloudFront"
  period              = 300
  statistic           = "Average"
  threshold           = 5
  alarm_description   = "This metric monitors CloudFront 4xx error rate"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DistributionId = aws_cloudfront_distribution.main.id
  }

  tags = {
    Name        = "${var.project_name}-cloudfront-4xx-errors-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_cloudwatch_metric_alarm" "cloudfront_5xx_errors" {
  alarm_name          = "${var.project_name}-cloudfront-5xx-errors-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "5xxErrorRate"
  namespace           = "AWS/CloudFront"
  period              = 300
  statistic           = "Average"
  threshold           = 1
  alarm_description   = "This metric monitors CloudFront 5xx error rate"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DistributionId = aws_cloudfront_distribution.main.id
  }

  tags = {
    Name        = "${var.project_name}-cloudfront-5xx-errors-${var.environment}"
    Environment = var.environment
  }
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.main.id
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.main.domain_name
}

output "cloudfront_distribution_arn" {
  description = "CloudFront distribution ARN"
  value       = aws_cloudfront_distribution.main.arn
}

output "waf_web_acl_id" {
  description = "WAF Web ACL ID"
  value       = aws_wafv2_web_acl.cloudfront.id
}

output "waf_web_acl_arn" {
  description = "WAF Web ACL ARN"
  value       = aws_wafv2_web_acl.cloudfront.arn
}

output "cache_invalidation_topic_arn" {
  description = "SNS topic ARN for cache invalidation"
  value       = aws_sns_topic.cache_invalidation.arn
}

output "cloudfront_logs_bucket" {
  description = "CloudFront logs bucket name"
  value       = aws_s3_bucket.cloudfront_logs.id
}
