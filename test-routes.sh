#!/bin/bash

# Integration Testing Script
# Tests all routes and endpoints

API_URL="http://localhost:3009"
CLIENT_URL="http://localhost:5179"

echo "=========================================="
echo "MANGU Publishing - Integration Testing"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

test_count=0
pass_count=0
fail_count=0

test_route() {
    local method=$1
    local url=$2
    local expected_status=$3
    local description=$4
    
    test_count=$((test_count + 1))
    echo -n "Test $test_count: $description ... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>&1)
    else
        response=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$url" 2>&1)
    fi
    
    if [ "$response" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} (Status: $response)"
        pass_count=$((pass_count + 1))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (Expected: $expected_status, Got: $response)"
        fail_count=$((fail_count + 1))
        return 1
    fi
}

echo "Testing API Routes..."
echo ""

# Health check
test_route "GET" "$API_URL/api/health" "200" "Health check"

# Books API
test_route "GET" "$API_URL/api/books" "200" "GET /api/books - List books"
test_route "GET" "$API_URL/api/books/featured" "200" "GET /api/books/featured - Featured book"
test_route "GET" "$API_URL/api/books/trending" "200" "GET /api/books/trending - Trending books"
test_route "GET" "$API_URL/api/books/search?q=test" "200" "GET /api/books/search - Search books"

# Categories
test_route "GET" "$API_URL/api/categories" "200" "GET /api/categories - List categories"

# Genres (new route)
test_route "GET" "$API_URL/api/genres/test" "200" "GET /api/genres/:id - Genre books"

# Series (new route)
test_route "GET" "$API_URL/api/series/test" "200" "GET /api/series/:id - Series books"

# Wishlists (new route) - using example ID from user query
test_route "GET" "$API_URL/api/wishlists/toolu_01Qzn4XQTN4K2wNMwLXkQijT" "404" "GET /api/wishlists/:id - Wishlist (expected 404 if not exists)"

# Reading sessions (new route) - using example ID from user query
test_route "GET" "$API_URL/api/reading-sessions/249" "404" "GET /api/reading-sessions/:id - Reading session (expected 404 if not exists)"

echo ""
echo "=========================================="
echo "Test Results"
echo "=========================================="
echo "Total tests: $test_count"
echo -e "${GREEN}Passed: $pass_count${NC}"
echo -e "${RED}Failed: $fail_count${NC}"
echo ""

if [ $fail_count -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed.${NC}"
    exit 1
fi

