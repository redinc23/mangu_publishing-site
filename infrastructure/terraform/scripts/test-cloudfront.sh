#!/bin/bash

# CloudFront Configuration Test Script
# Tests cache behavior, security headers, WAF, and error pages

set -e

ENVIRONMENT="${1:-production}"
DOMAIN="${2:-}"

echo "🧪 CloudFront Configuration Tests"
echo "=================================="
echo "Environment: $ENVIRONMENT"
echo ""

# Get CloudFront domain from Terraform
cd "$(dirname "$0")/.."
CF_DOMAIN=$(terraform output -raw cloudfront_domain_name 2>/dev/null || echo "")
DISTRIBUTION_ID=$(terraform output -raw cloudfront_distribution_id 2>/dev/null || echo "")

if [ -z "$CF_DOMAIN" ]; then
    echo "❌ Error: Could not get CloudFront domain"
    echo "   Make sure Terraform has been applied"
    exit 1
fi

TEST_DOMAIN="${DOMAIN:-$CF_DOMAIN}"
echo "Testing domain: $TEST_DOMAIN"
echo "Distribution ID: $DISTRIBUTION_ID"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

pass() {
    echo -e "${GREEN}✓${NC} $1"
}

fail() {
    echo -e "${RED}✗${NC} $1"
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

test_counter=0
pass_counter=0
fail_counter=0

run_test() {
    ((test_counter++))
    echo ""
    echo "Test $test_counter: $1"
    echo "---"
}

# Test 1: Basic connectivity
run_test "Basic Connectivity"
if curl -s -o /dev/null -w "%{http_code}" "https://$TEST_DOMAIN/" | grep -q "200\|301\|302"; then
    pass "Domain is accessible"
    ((pass_counter++))
else
    fail "Domain is not accessible"
    ((fail_counter++))
fi

# Test 2: HTTPS redirect
run_test "HTTPS Redirect"
if curl -s -I "http://$TEST_DOMAIN/" | grep -q "301\|302"; then
    pass "HTTP redirects to HTTPS"
    ((pass_counter++))
else
    warn "No HTTP to HTTPS redirect detected"
fi

# Test 3: Security headers
run_test "Security Headers"
HEADERS=$(curl -s -I "https://$TEST_DOMAIN/" 2>/dev/null)

check_header() {
    if echo "$HEADERS" | grep -qi "$1"; then
        pass "$1 header present"
        ((pass_counter++))
        return 0
    else
        fail "$1 header missing"
        ((fail_counter++))
        return 1
    fi
}

check_header "strict-transport-security"
check_header "x-content-type-options"
check_header "x-frame-options"
check_header "x-xss-protection"

# Test 4: CloudFront serving
run_test "CloudFront Header"
if echo "$HEADERS" | grep -qi "x-cache"; then
    CACHE_STATUS=$(echo "$HEADERS" | grep -i "x-cache" | head -1)
    pass "CloudFront is serving content: $CACHE_STATUS"
    ((pass_counter++))
else
    warn "X-Cache header not found (might be first request)"
fi

# Test 5: Compression
run_test "Compression (Gzip/Brotli)"
if curl -s -I -H "Accept-Encoding: gzip, br" "https://$TEST_DOMAIN/" | grep -qi "content-encoding"; then
    ENCODING=$(curl -s -I -H "Accept-Encoding: gzip, br" "https://$TEST_DOMAIN/" | grep -i "content-encoding")
    pass "Compression enabled: $ENCODING"
    ((pass_counter++))
else
    warn "Compression not detected (might not apply to this content)"
fi

# Test 6: API path (no caching)
run_test "API Path Caching Behavior"
API_HEADERS=$(curl -s -I "https://$TEST_DOMAIN/api/health" 2>/dev/null || true)
if echo "$API_HEADERS" | grep -qi "x-cache"; then
    if echo "$API_HEADERS" | grep -qi "x-cache.*miss"; then
        pass "API requests are not cached (correct behavior)"
        ((pass_counter++))
    else
        warn "API requests might be cached (check cache policy)"
    fi
else
    warn "Cannot determine API caching behavior"
fi

# Test 7: Static assets caching
run_test "Static Assets Caching"
STATIC_HEADERS=$(curl -s -I "https://$TEST_DOMAIN/assets/index.js" 2>/dev/null || true)
if echo "$STATIC_HEADERS" | grep -qi "cache-control"; then
    CACHE_CONTROL=$(echo "$STATIC_HEADERS" | grep -i "cache-control" | head -1)
    pass "Static assets have cache headers: $CACHE_CONTROL"
    ((pass_counter++))
else
    warn "No cache-control header found for static assets"
fi

# Test 8: Error pages
run_test "Custom Error Pages"
NOT_FOUND=$(curl -s -o /dev/null -w "%{http_code}" "https://$TEST_DOMAIN/this-does-not-exist-12345" 2>/dev/null)
if [ "$NOT_FOUND" = "200" ]; then
    pass "404 errors return custom page (SPA routing)"
    ((pass_counter++))
else
    warn "404 behavior: HTTP $NOT_FOUND"
fi

# Test 9: WAF protection
run_test "WAF Protection"
if [ -n "$DISTRIBUTION_ID" ]; then
    WAF_ARN=$(aws cloudfront get-distribution --id "$DISTRIBUTION_ID" --query "Distribution.DistributionConfig.WebACLId" --output text 2>/dev/null || echo "")
    if [ -n "$WAF_ARN" ] && [ "$WAF_ARN" != "None" ]; then
        pass "WAF is enabled for distribution"
        ((pass_counter++))
    else
        fail "WAF is not enabled"
        ((fail_counter++))
    fi
else
    warn "Cannot check WAF (no distribution ID)"
fi

# Test 10: HTTP/2 or HTTP/3
run_test "HTTP Version Support"
HTTP_VERSION=$(curl -s -I --http2 "https://$TEST_DOMAIN/" 2>/dev/null | head -1)
if echo "$HTTP_VERSION" | grep -q "HTTP/2"; then
    pass "HTTP/2 is supported"
    ((pass_counter++))
elif echo "$HTTP_VERSION" | grep -q "HTTP/3"; then
    pass "HTTP/3 is supported"
    ((pass_counter++))
else
    warn "HTTP/1.1 only (consider enabling HTTP/2)"
fi

# Test 11: TLS version
run_test "TLS Configuration"
TLS_INFO=$(echo | openssl s_client -connect "$TEST_DOMAIN:443" -tls1_2 2>/dev/null | grep "Protocol" || true)
if echo "$TLS_INFO" | grep -q "TLSv1.2\|TLSv1.3"; then
    pass "TLS 1.2 or higher: $TLS_INFO"
    ((pass_counter++))
else
    warn "Could not verify TLS version"
fi

# Test 12: CORS headers
run_test "CORS Configuration"
CORS_HEADERS=$(curl -s -I -H "Origin: https://example.com" "https://$TEST_DOMAIN/" 2>/dev/null)
if echo "$CORS_HEADERS" | grep -qi "access-control-allow"; then
    pass "CORS headers are configured"
    ((pass_counter++))
else
    warn "No CORS headers detected (might be intentional)"
fi

# Summary
echo ""
echo "=================================="
echo "📊 Test Summary"
echo "=================================="
echo "Total Tests: $test_counter"
echo -e "${GREEN}Passed: $pass_counter${NC}"
echo -e "${RED}Failed: $fail_counter${NC}"
echo ""

if [ $fail_counter -eq 0 ]; then
    echo -e "${GREEN}✅ All critical tests passed!${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Some tests failed. Review the output above.${NC}"
    exit 1
fi
