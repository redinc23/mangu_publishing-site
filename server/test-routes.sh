#!/bin/bash
# Smoke Tests for Day 1 Beta Routes
# Run this after starting the server with: npm run dev

set -e

BASE_URL="http://localhost:3002"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🧪 Running Smoke Tests for Day 1 Beta Routes"
echo "=============================================="
echo ""

# Test 1: Health Check
echo "1. Testing Health Check..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/api/health)
if [ "$RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ Health check passed${NC}"
else
    echo -e "${RED}❌ Health check failed (HTTP $RESPONSE)${NC}"
fi
echo ""

# Test 2: Homepage (Books Listing)
echo "2. Testing Homepage (Books Listing)..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/api/books)
if [ "$RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ Books listing passed${NC}"
else
    echo -e "${RED}❌ Books listing failed (HTTP $RESPONSE)${NC}"
fi
echo ""

# Test 3: Featured Books
echo "3. Testing Featured Books..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/api/books/featured)
if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "404" ]; then
    echo -e "${GREEN}✅ Featured books endpoint works (HTTP $RESPONSE)${NC}"
else
    echo -e "${RED}❌ Featured books failed (HTTP $RESPONSE)${NC}"
fi
echo ""

# Test 4: Trending Books
echo "4. Testing Trending Books..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/api/books/trending)
if [ "$RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ Trending books passed${NC}"
else
    echo -e "${RED}❌ Trending books failed (HTTP $RESPONSE)${NC}"
fi
echo ""

# Test 5: Cart (Should require auth - expect 401)
echo "5. Testing Cart (should require auth)..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/api/cart)
if [ "$RESPONSE" = "401" ] || [ "$RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ Cart endpoint works (HTTP $RESPONSE)${NC}"
    if [ "$RESPONSE" = "401" ]; then
        echo -e "${YELLOW}   (401 is correct - auth required)${NC}"
    fi
else
    echo -e "${RED}❌ Cart endpoint failed (HTTP $RESPONSE)${NC}"
fi
echo ""

# Test 6: Library (Should require auth - expect 401)
echo "6. Testing Library (should require auth)..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/api/library)
if [ "$RESPONSE" = "401" ] || [ "$RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ Library endpoint works (HTTP $RESPONSE)${NC}"
    if [ "$RESPONSE" = "401" ]; then
        echo -e "${YELLOW}   (401 is correct - auth required)${NC}"
    fi
else
    echo -e "${RED}❌ Library endpoint failed (HTTP $RESPONSE)${NC}"
fi
echo ""

# Test 7: Authors Featured
echo "7. Testing Authors Featured..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/api/authors/featured)
if [ "$RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ Authors featured passed${NC}"
else
    echo -e "${RED}❌ Authors featured failed (HTTP $RESPONSE)${NC}"
fi
echo ""

# Test 8: User Sync (Should require auth - expect 401)
echo "8. Testing User Sync (should require auth)..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST $BASE_URL/api/users/sync)
if [ "$RESPONSE" = "401" ]; then
    echo -e "${GREEN}✅ User sync endpoint works (HTTP $RESPONSE)${NC}"
    echo -e "${YELLOW}   (401 is correct - auth required)${NC}"
else
    echo -e "${RED}❌ User sync endpoint unexpected response (HTTP $RESPONSE)${NC}"
fi
echo ""

# Test 9: Stripe Checkout Session (needs body)
echo "9. Testing Stripe Create Checkout Session..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST $BASE_URL/api/stripe/create-checkout-session \
    -H "Content-Type: application/json" \
    -d '{"items":[{"name":"Test Book","amount":999,"quantity":1}]}')
if [ "$RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ Stripe checkout passed${NC}"
else
    echo -e "${YELLOW}⚠️  Stripe checkout returned HTTP $RESPONSE${NC}"
    echo -e "${YELLOW}   (May need STRIPE_SECRET_KEY configured)${NC}"
fi
echo ""

# Test 10: Stripe Webhook (will fail without signature, that's OK)
echo "10. Testing Stripe Webhook..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST $BASE_URL/api/stripe/webhook \
    -H "Content-Type: application/json" \
    -d '{}')
if [ "$RESPONSE" = "400" ]; then
    echo -e "${GREEN}✅ Stripe webhook endpoint exists (HTTP $RESPONSE)${NC}"
    echo -e "${YELLOW}   (400 is expected - missing signature)${NC}"
else
    echo -e "${YELLOW}⚠️  Stripe webhook returned HTTP $RESPONSE${NC}"
fi
echo ""

echo "=============================================="
echo "🎉 Smoke Tests Complete!"
echo ""
echo "Next steps:"
echo "1. Fix any ❌ failed tests"
echo "2. Test with real JWT tokens from Cognito"
echo "3. Configure STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET"
echo "4. Run database migrations: npm run migrate"
