#!/bin/bash
set -eo pipefail

# Validation script for GitHub Actions automation implementation
# Tests all 5 automation tasks

echo "🔍 Validating GitHub Actions Automation Implementation"
echo "======================================================"
echo ""

PASS=0
FAIL=0

check() {
    local name="$1"
    local command="$2"
    
    echo -n "Checking $name... "
    if eval "$command" &>/dev/null; then
        echo "✅ PASS"
        PASS=$((PASS+1))
    else
        echo "❌ FAIL"
        FAIL=$((FAIL+1))
    fi
}

echo "Task 1: Build + Dependency Caching"
echo "-----------------------------------"
check "setup-deps job exists" "grep -q 'setup-deps:' .github/workflows/deploy.yml"
check "Multi-path cache config" "grep -q 'cache-dependency-path:' .github/workflows/deploy.yml"
check "Documentation updated" "grep -q 'Cache Strategy' docs/ci-cd-pipeline-upgrade.md || grep -q 'Caching' docs/ci-cd-pipeline-upgrade.md"
echo ""

echo "Task 2: End-to-End Testing"
echo "--------------------------"
check "E2E test suite exists" "test -d tests/e2e && test -f tests/e2e/auth.spec.js"
check "Playwright config exists" "test -f tests/e2e/playwright.config.js"
check "E2E job in workflow" "grep -q 'e2e-tests:' .github/workflows/deploy.yml"
check "Artifact upload on failure" "grep -q 'playwright-report' .github/workflows/deploy.yml"
echo ""

echo "Task 3: Automated Promotion & Rollback"
echo "---------------------------------------"
check "Staging promotion job" "grep -q 'promote-images-staging:' .github/workflows/deploy.yml"
check "Production promotion job" "grep -q 'promote-images-production:' .github/workflows/deploy.yml"
check "Production environment gate" "grep -q 'environment: production' .github/workflows/deploy.yml"
check "Rollback job exists" "grep -q 'rollback-on-failure:' .github/workflows/deploy.yml"
check "Rollback script exists" "test -f scripts/rollback/auto.sh && test -x scripts/rollback/auto.sh"
check "Promotion script exists" "test -f scripts/promotion/promote.sh && test -x scripts/promotion/promote.sh"
echo ""

echo "Task 4: Secret Management"
echo "-------------------------"
check "Seed secrets script" "test -f scripts/credentials/seed-secrets.sh && test -x scripts/credentials/seed-secrets.sh"
check "Rotate secrets workflow" "test -f .github/workflows/rotate-secrets.yml"
check "Rotate script enhanced" "grep -q 'force' scripts/rotate-keys.sh"
check "Monthly schedule configured" "grep -q 'cron:.*1 \\* \\*' .github/workflows/rotate-secrets.yml"
check "Credential validation step" "grep -q 'check_credentials' .github/workflows/deploy.yml"
echo ""

echo "Task 5: Backup & DR Documentation"
echo "----------------------------------"
check "DR runbook exists" "test -f docs/runbooks/backup-and-dr.md"
check "RACI matrix documented" "grep -q 'RACI' docs/runbooks/backup-and-dr.md"
check "RTO/RPO targets" "grep -q 'RTO' docs/runbooks/backup-and-dr.md && grep -q 'RPO' docs/runbooks/backup-and-dr.md"
check "Restore commands present" "grep -q 'restore-db-instance' docs/runbooks/backup-and-dr.md"
check "Cross-region procedures" "grep -q 'us-east-1' docs/runbooks/backup-and-dr.md"
check "Cross-links in DEPLOYMENT.md" "grep -q 'backup-and-dr' docs/DEPLOYMENT.md"
check "Cross-links in COST guide" "grep -q 'backup-and-dr' docs/COST_MONITORING_GUIDE.md"
echo ""

echo "======================================================"
echo "Summary: $PASS passed, $FAIL failed"
echo ""

if [ $FAIL -eq 0 ]; then
    echo "✅ All validation checks passed!"
    echo ""
    echo "Next Steps:"
    echo "1. Test workflow: git push origin main"
    echo "2. Seed secrets: ./scripts/credentials/seed-secrets.sh staging"
    echo "3. Run E2E locally: npm --prefix client run test:e2e"
    echo "4. Review DR runbook: cat docs/runbooks/backup-and-dr.md"
    exit 0
else
    echo "⚠️  Some validation checks failed. Review output above."
    exit 1
fi
