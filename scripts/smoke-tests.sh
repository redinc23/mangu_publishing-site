#!/bin/bash

set -e

BASE_URL="${1:-http://localhost:3000}"
TIMEOUT=30
MAX_RETRIES=5

echo "🔍 Running smoke tests against: $BASE_URL"

test_endpoint() {
  local endpoint=$1
  local expected_status=$2
  local description=$3
  
  echo "Testing: $description"
  
  retry=0
  while [ $retry -lt $MAX_RETRIES ]; do
    status=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$BASE_URL$endpoint" || echo "000")
    
    if [ "$status" = "$expected_status" ]; then
      echo "✅ PASS: $description (HTTP $status)"
      return 0
    fi
    
    retry=$((retry + 1))
    if [ $retry -lt $MAX_RETRIES ]; then
      echo "⏳ Retry $retry/$MAX_RETRIES for $description..."
      sleep 5
    fi
  done
  
  echo "❌ FAIL: $description (Expected $expected_status, got $status)"
  return 1
}

test_json_response() {
  local endpoint=$1
  local description=$2
  
  echo "Testing: $description"
  
  response=$(curl -s --max-time $TIMEOUT "$BASE_URL$endpoint")
  
  if echo "$response" | jq empty 2>/dev/null; then
    echo "✅ PASS: $description (Valid JSON)"
    return 0
  else
    echo "❌ FAIL: $description (Invalid JSON)"
    echo "Response: $response"
    return 1
  fi
}

failed_tests=0

echo ""
echo "📋 Health Check Tests"
echo "===================="
test_endpoint "/api/health" "200" "Health endpoint" || ((failed_tests++))

echo ""
echo "📋 API Endpoint Tests"
echo "===================="
test_endpoint "/api/books" "200" "Books endpoint" || ((failed_tests++))
test_json_response "/api/books" "Books JSON response" || ((failed_tests++))

test_endpoint "/api/books/featured" "200" "Featured books endpoint" || ((failed_tests++))
test_json_response "/api/books/featured" "Featured books JSON response" || ((failed_tests++))

test_endpoint "/api/books/trending" "200" "Trending books endpoint" || ((failed_tests++))
test_json_response "/api/books/trending" "Trending books JSON response" || ((failed_tests++))

echo ""
echo "📋 Database Connectivity Tests"
echo "=============================="
health_response=$(curl -s --max-time $TIMEOUT "$BASE_URL/api/health")
db_status=$(echo "$health_response" | jq -r '.database // "unknown"')

if [ "$db_status" = "connected" ]; then
  echo "✅ PASS: Database connectivity"
else
  echo "❌ FAIL: Database connectivity (Status: $db_status)"
  ((failed_tests++))
fi

echo ""
echo "📋 Cache Connectivity Tests"
echo "============================"
cache_status=$(echo "$health_response" | jq -r '.cache // "unknown"')

if [ "$cache_status" = "connected" ] || [ "$cache_status" = "disabled" ]; then
  echo "✅ PASS: Cache connectivity (Status: $cache_status)"
else
  echo "❌ FAIL: Cache connectivity (Status: $cache_status)"
  ((failed_tests++))
fi

echo ""
echo "📋 Performance Tests"
echo "==================="
start_time=$(date +%s%N)
curl -s --max-time $TIMEOUT "$BASE_URL/api/health" > /dev/null
end_time=$(date +%s%N)
response_time=$(( (end_time - start_time) / 1000000 ))

if [ $response_time -lt 1000 ]; then
  echo "✅ PASS: Health endpoint response time (${response_time}ms)"
else
  echo "⚠️  WARN: Health endpoint response time is slow (${response_time}ms)"
fi

echo ""
echo "📊 Test Summary"
echo "==============="
total_tests=$((9))
passed_tests=$((total_tests - failed_tests))
echo "Passed: $passed_tests/$total_tests"
echo "Failed: $failed_tests/$total_tests"

if [ $failed_tests -gt 0 ]; then
  echo ""
  echo "❌ Smoke tests failed!"
  exit 1
else
  echo ""
  echo "✅ All smoke tests passed!"
  exit 0
fi
