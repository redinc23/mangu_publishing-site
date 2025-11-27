#!/usr/bin/env node
/**
 * Smoke Test Suite
 * Tests critical endpoints to ensure the application is functional
 */

import fetch from 'node-fetch';

const API_BASE_URL = process.env.API_URL || 'http://localhost:3000';
const TIMEOUT = 5000;

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

let passCount = 0;
let failCount = 0;
const results = [];

/**
 * Fetch with timeout
 */
async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeout);
    return response;
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

/**
 * Run a single test
 */
async function test(name, testFn) {
  process.stdout.write(`${colors.cyan}Testing:${colors.reset} ${name}... `);
  
  try {
    await testFn();
    console.log(`${colors.green}✓ PASS${colors.reset}`);
    passCount++;
    results.push({ name, status: 'PASS' });
  } catch (error) {
    console.log(`${colors.red}✗ FAIL${colors.reset}`);
    console.log(`  ${colors.red}Error:${colors.reset} ${error.message}`);
    failCount++;
    results.push({ name, status: 'FAIL', error: error.message });
  }
}

/**
 * Assert helpers
 */
function assertEqual(actual, expected, message = '') {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected} but got ${actual}`);
  }
}

function assertStatus(response, expectedStatus, message = '') {
  if (response.status !== expectedStatus) {
    throw new Error(
      message || `Expected status ${expectedStatus} but got ${response.status}`
    );
  }
}

function assertContains(object, key, message = '') {
  if (!(key in object)) {
    throw new Error(message || `Expected object to contain key '${key}'`);
  }
}

/**
 * Test Suite
 */
async function runSmokeTests() {
  console.log(`${colors.blue}═══════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}      MANGU Publishing - Smoke Tests      ${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════════${colors.reset}`);
  console.log(`Testing API at: ${API_BASE_URL}\n`);

  // Test 1: Health Check
  await test('GET /api/health returns 200', async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/health`);
    assertStatus(response, 200, 'Health endpoint should return 200');
    
    const data = await response.json();
    assertContains(data, 'status');
    assertContains(data, 'uptime');
    assertContains(data, 'timestamp');
  });

  // Test 2: Liveness Probe
  await test('GET /api/health/live returns 200', async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/health/live`);
    assertStatus(response, 200);
    
    const data = await response.json();
    assertEqual(data.alive, true, 'Liveness check should return alive: true');
  });

  // Test 3: Readiness Probe
  await test('GET /api/health/ready returns 200 or 503', async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/health/ready`);
    
    if (response.status !== 200 && response.status !== 503) {
      throw new Error(`Expected 200 or 503, got ${response.status}`);
    }
    
    const data = await response.json();
    assertContains(data, 'ready');
  });

  // Test 4: Books List Endpoint
  await test('GET /api/books returns 200', async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/books`);
    assertStatus(response, 200);
    
    const data = await response.json();
    if (!Array.isArray(data) && !data.books) {
      throw new Error('Books endpoint should return an array or object with books');
    }
  });

  // Test 5: Featured Books
  await test('GET /api/books/featured returns 200', async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/books/featured`);
    assertStatus(response, 200);
    
    const data = await response.json();
    if (!Array.isArray(data)) {
      throw new Error('Featured books should return an array');
    }
  });

  // Test 6: Trending Books
  await test('GET /api/books/trending returns 200', async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/books/trending`);
    assertStatus(response, 200);
    
    const data = await response.json();
    if (!Array.isArray(data)) {
      throw new Error('Trending books should return an array');
    }
  });

  // Test 7: Auth - No Token Returns 401
  await test('GET /api/users/me without token returns 401', async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/users/me`);
    assertStatus(response, 401, 'Protected endpoint should return 401 without token');
  });

  // Test 8: Cart endpoint (if available)
  await test('GET /api/cart without token returns 401', async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/cart`);
    
    if (response.status !== 401 && response.status !== 404) {
      throw new Error(`Expected 401 or 404 (if cart endpoint doesn't exist), got ${response.status}`);
    }
  });

  // Test 9: Invalid Book ID Returns 404
  await test('GET /api/books/invalid-id returns 404', async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/books/99999999-9999-9999-9999-999999999999`);
    assertStatus(response, 404, 'Invalid book ID should return 404');
  });

  // Test 10: Search Endpoint
  await test('GET /api/search returns 200', async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/search?q=test`);
    assertStatus(response, 200);
  });

  // Print summary
  console.log(`\n${colors.blue}═══════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}              Test Summary                 ${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════════${colors.reset}`);
  console.log(`Total Tests: ${passCount + failCount}`);
  console.log(`${colors.green}Passed: ${passCount}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failCount}${colors.reset}`);
  
  if (failCount === 0) {
    console.log(`\n${colors.green}✓ All smoke tests passed!${colors.reset}`);
  } else {
    console.log(`\n${colors.red}✗ Some tests failed!${colors.reset}`);
  }
  console.log(`${colors.blue}═══════════════════════════════════════════${colors.reset}\n`);

  // Exit with appropriate code
  process.exit(failCount > 0 ? 1 : 0);
}

// Run tests
runSmokeTests().catch((error) => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});
