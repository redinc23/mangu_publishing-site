#!/usr/bin/env node

/**
 * MANGU Publishing - Environment Validation Script
 *
 * This script runs before `npm run dev` to validate port configuration.
 * It will BLOCK startup if ports are misconfigured.
 *
 * Official Port Assignments:
 * - Backend API: 3002
 * - Frontend Dev: 5173
 */

const fs = require('fs');
const path = require('path');

// Official port assignments - DO NOT CHANGE
const EXPECTED_PORTS = {
  backend: 3002,
  frontend: 5173,
};

const COLORS = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

function log(color, message) {
  console.log(`${color}${message}${COLORS.reset}`);
}

function checkFile(filePath, checks) {
  const errors = [];

  if (!fs.existsSync(filePath)) {
    return { exists: false, errors: [`File not found: ${filePath}`] };
  }

  const content = fs.readFileSync(filePath, 'utf-8');

  for (const check of checks) {
    if (check.type === 'contains') {
      if (!content.includes(check.value)) {
        errors.push(check.errorMessage);
      }
    } else if (check.type === 'not_contains') {
      if (content.includes(check.value)) {
        errors.push(check.errorMessage);
      }
    } else if (check.type === 'regex') {
      if (!check.pattern.test(content)) {
        errors.push(check.errorMessage);
      }
    }
  }

  return { exists: true, errors };
}

function main() {
  console.log('\n');
  log(COLORS.blue, '╔════════════════════════════════════════════════════════════╗');
  log(COLORS.blue, '║          MANGU Publishing - Environment Check              ║');
  log(COLORS.blue, '╚════════════════════════════════════════════════════════════╝');
  console.log('\n');

  const rootDir = path.resolve(__dirname, '..');
  let hasErrors = false;
  const allErrors = [];

  // Check 1: Server .env file
  log(COLORS.yellow, '▶ Checking server/.env...');
  const serverEnvPath = path.join(rootDir, 'server', '.env');
  const serverEnvResult = checkFile(serverEnvPath, [
    {
      type: 'regex',
      pattern: /PORT\s*=\s*3002/,
      errorMessage: `Server PORT must be ${EXPECTED_PORTS.backend} (found different value or missing)`,
    },
  ]);

  if (!serverEnvResult.exists) {
    log(COLORS.red, '  ✗ server/.env not found - creating with defaults...');
    const serverEnvContent = `# MANGU Publishing Server Configuration
NODE_ENV=development
PORT=${EXPECTED_PORTS.backend}
FRONTEND_URL=http://localhost:${EXPECTED_PORTS.frontend}
CORS_ORIGINS=http://localhost:${EXPECTED_PORTS.frontend}
DISABLE_REDIS=1
JWT_SECRET=development-secret-key
`;
    fs.writeFileSync(serverEnvPath, serverEnvContent);
    log(COLORS.green, '  ✓ Created server/.env with correct port');
  } else if (serverEnvResult.errors.length > 0) {
    serverEnvResult.errors.forEach(err => {
      log(COLORS.red, `  ✗ ${err}`);
      allErrors.push(err);
    });
    hasErrors = true;
  } else {
    log(COLORS.green, `  ✓ Server port configured correctly (${EXPECTED_PORTS.backend})`);
  }

  // Check 2: Client .env file
  log(COLORS.yellow, '▶ Checking client/.env...');
  const clientEnvPath = path.join(rootDir, 'client', '.env');
  const clientEnvResult = checkFile(clientEnvPath, [
    {
      type: 'regex',
      pattern: /VITE_API_URL\s*=\s*http:\/\/localhost:3002/,
      errorMessage: `Client VITE_API_URL must point to port ${EXPECTED_PORTS.backend}`,
    },
  ]);

  if (!clientEnvResult.exists) {
    log(COLORS.red, '  ✗ client/.env not found - creating with defaults...');
    const clientEnvContent = `# MANGU Publishing Client Configuration
VITE_API_URL=http://localhost:${EXPECTED_PORTS.backend}
VITE_APP_NAME=MANGU Publishing
`;
    fs.writeFileSync(clientEnvPath, clientEnvContent);
    log(COLORS.green, '  ✓ Created client/.env with correct API URL');
  } else if (clientEnvResult.errors.length > 0) {
    clientEnvResult.errors.forEach(err => {
      log(COLORS.red, `  ✗ ${err}`);
      allErrors.push(err);
    });
    hasErrors = true;
  } else {
    log(COLORS.green, `  ✓ Client API URL configured correctly (port ${EXPECTED_PORTS.backend})`);
  }

  // Check 3: Look for hardcoded wrong ports in source files
  log(COLORS.yellow, '▶ Scanning for hardcoded wrong ports...');
  const wrongPortPatterns = [
    'localhost:5000',
    'localhost:3000',
    'localhost:3001',
    'localhost:8080',
  ];

  const filesToCheck = [
    'client/src/pages/HomePage.jsx',
    'client/src/pages/LibraryPage.jsx',
    'client/src/pages/BookDetailsPage.jsx',
    'client/src/pages/CartPage.jsx',
    'client/src/pages/AdminPage.jsx',
  ];

  let foundWrongPorts = false;
  for (const file of filesToCheck) {
    const filePath = path.join(rootDir, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      for (const pattern of wrongPortPatterns) {
        if (content.includes(pattern)) {
          log(COLORS.red, `  ✗ Found "${pattern}" in ${file}`);
          allErrors.push(`Hardcoded wrong port in ${file}: ${pattern}`);
          foundWrongPorts = true;
          hasErrors = true;
        }
      }
    }
  }

  if (!foundWrongPorts) {
    log(COLORS.green, '  ✓ No hardcoded wrong ports found');
  }

  // Summary
  console.log('\n');
  if (hasErrors) {
    log(COLORS.red, '╔════════════════════════════════════════════════════════════╗');
    log(COLORS.red, '║                    ✗ VALIDATION FAILED                     ║');
    log(COLORS.red, '╚════════════════════════════════════════════════════════════╝');
    console.log('\n');
    log(COLORS.red, 'Errors found:');
    allErrors.forEach((err, i) => {
      log(COLORS.red, `  ${i + 1}. ${err}`);
    });
    console.log('\n');
    log(COLORS.yellow, 'Please fix these issues before starting the dev server.');
    log(COLORS.yellow, `Official ports: Backend=${EXPECTED_PORTS.backend}, Frontend=${EXPECTED_PORTS.frontend}`);
    console.log('\n');
    process.exit(1);
  } else {
    log(COLORS.green, '╔════════════════════════════════════════════════════════════╗');
    log(COLORS.green, '║                    ✓ ALL CHECKS PASSED                     ║');
    log(COLORS.green, '╚════════════════════════════════════════════════════════════╝');
    console.log('\n');
    log(COLORS.green, `Ready to start: Backend on ${EXPECTED_PORTS.backend}, Frontend on ${EXPECTED_PORTS.frontend}`);
    console.log('\n');
    process.exit(0);
  }
}

main();
