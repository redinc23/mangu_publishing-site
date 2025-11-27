#!/bin/bash
#
# Billing Configuration Validation Script
# Validates Terraform billing configuration and AWS cost monitoring setup
#

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "==================================="
echo "Billing Configuration Validation"
echo "==================================="
echo ""

# Check if we're in Terraform directory
if [ ! -f "billing.tf" ]; then
    echo -e "${RED}✗ Error: Must run from terraform directory${NC}"
    exit 1
fi

echo "1. Terraform Validation"
echo "-----------------------"

# Validate Terraform syntax
if terraform validate > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Terraform syntax valid${NC}"
else
    echo -e "${RED}✗ Terraform validation failed${NC}"
    terraform validate
    exit 1
fi

# Check for required variables
echo ""
echo "2. Required Variables Check"
echo "---------------------------"

required_vars=(
    "monthly_budget_limit"
    "ecs_budget_limit"
    "rds_budget_limit"
    "anomaly_absolute_threshold"
    "anomaly_impact_threshold"
    "budget_time_period_start"
    "budget_alert_emails"
)

for var in "${required_vars[@]}"; do
    if grep -q "variable \"$var\"" variables.tf; then
        echo -e "${GREEN}✓ Variable '$var' defined${NC}"
    else
        echo -e "${RED}✗ Variable '$var' missing${NC}"
    fi
done

# Check Terraform outputs
echo ""
echo "3. Terraform Outputs Check"
echo "--------------------------"

if terraform output sns_topic_arn > /dev/null 2>&1; then
    SNS_ARN=$(terraform output -raw sns_topic_arn)
    echo -e "${GREEN}✓ SNS Topic ARN: ${SNS_ARN}${NC}"
    
    # Validate SNS subscriptions
    echo ""
    echo "4. SNS Subscription Validation"
    echo "-------------------------------"
    
    SUBSCRIPTIONS=$(aws sns list-subscriptions-by-topic --topic-arn "$SNS_ARN" 2>/dev/null || echo "")
    
    if [ -n "$SUBSCRIPTIONS" ]; then
        PENDING=$(echo "$SUBSCRIPTIONS" | jq -r '.Subscriptions[] | select(.SubscriptionArn == "PendingConfirmation") | .Endpoint' 2>/dev/null || echo "")
        CONFIRMED=$(echo "$SUBSCRIPTIONS" | jq -r '.Subscriptions[] | select(.SubscriptionArn != "PendingConfirmation") | .Endpoint' 2>/dev/null || echo "")
        
        if [ -n "$CONFIRMED" ]; then
            echo -e "${GREEN}✓ Confirmed subscriptions:${NC}"
            echo "$CONFIRMED" | while read -r email; do
                echo "  - $email"
            done
        fi
        
        if [ -n "$PENDING" ]; then
            echo -e "${YELLOW}⚠ Pending confirmations:${NC}"
            echo "$PENDING" | while read -r email; do
                echo "  - $email (check inbox)"
            done
        fi
    else
        echo -e "${YELLOW}⚠ Unable to check SNS subscriptions (AWS CLI access required)${NC}"
    fi
else
    echo -e "${YELLOW}⚠ SNS Topic not yet created - run 'terraform apply' first${NC}"
fi

# Check budgets
echo ""
echo "5. AWS Budgets Validation"
echo "-------------------------"

if command -v aws >/dev/null 2>&1; then
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text 2>/dev/null || echo "")
    
    if [ -n "$ACCOUNT_ID" ]; then
        BUDGETS=$(aws budgets describe-budgets --account-id "$ACCOUNT_ID" --max-results 10 2>/dev/null || echo "")
        
        if [ -n "$BUDGETS" ]; then
            BUDGET_COUNT=$(echo "$BUDGETS" | jq '.Budgets | length' 2>/dev/null || echo "0")
            echo -e "${GREEN}✓ Found $BUDGET_COUNT budgets${NC}"
            
            # Check for our specific budgets
            for budget_type in "monthly" "ecs" "rds"; do
                if echo "$BUDGETS" | jq -e ".Budgets[] | select(.BudgetName | contains(\"$budget_type\"))" > /dev/null 2>&1; then
                    echo -e "${GREEN}  ✓ ${budget_type} budget configured${NC}"
                else
                    echo -e "${YELLOW}  ⚠ ${budget_type} budget not found${NC}"
                fi
            done
        else
            echo -e "${YELLOW}⚠ No budgets found - apply Terraform configuration${NC}"
        fi
    else
        echo -e "${YELLOW}⚠ Unable to verify AWS budgets (AWS credentials required)${NC}"
    fi
else
    echo -e "${YELLOW}⚠ AWS CLI not installed - skipping AWS validation${NC}"
fi

# Check anomaly monitors
echo ""
echo "6. Cost Anomaly Detection"
echo "-------------------------"

if command -v aws >/dev/null 2>&1; then
    MONITORS=$(aws ce get-anomaly-monitors --max-results 10 2>/dev/null || echo "")
    
    if [ -n "$MONITORS" ]; then
        MONITOR_COUNT=$(echo "$MONITORS" | jq '.AnomalyMonitors | length' 2>/dev/null || echo "0")
        echo -e "${GREEN}✓ Found $MONITOR_COUNT anomaly monitors${NC}"
        
        # Check for service and account monitors
        if echo "$MONITORS" | jq -e '.AnomalyMonitors[] | select(.MonitorType == "DIMENSIONAL")' > /dev/null 2>&1; then
            echo -e "${GREEN}  ✓ Service-level monitor configured${NC}"
        fi
        
        if echo "$MONITORS" | jq -e '.AnomalyMonitors[] | select(.MonitorType == "CUSTOM")' > /dev/null 2>&1; then
            echo -e "${GREEN}  ✓ Account-level monitor configured${NC}"
        fi
    else
        echo -e "${YELLOW}⚠ No anomaly monitors found${NC}"
    fi
fi

# Check CloudWatch dashboard
echo ""
echo "7. CloudWatch Dashboard"
echo "-----------------------"

if terraform output cost_dashboard_url > /dev/null 2>&1; then
    DASHBOARD_URL=$(terraform output -raw cost_dashboard_url)
    echo -e "${GREEN}✓ Dashboard URL: ${DASHBOARD_URL}${NC}"
else
    echo -e "${YELLOW}⚠ Dashboard not yet created${NC}"
fi

# Lifecycle protection check
echo ""
echo "8. Lifecycle Protection"
echo "-----------------------"

if grep -q "prevent_destroy = true" billing.tf; then
    PROTECTED_COUNT=$(grep -c "prevent_destroy = true" billing.tf)
    echo -e "${GREEN}✓ ${PROTECTED_COUNT} resources have lifecycle protection${NC}"
else
    echo -e "${RED}✗ No lifecycle protection found${NC}"
fi

# Summary
echo ""
echo "==================================="
echo "Validation Summary"
echo "==================================="
echo ""

# Run Terraform plan to check for changes
echo "Running Terraform plan check..."
if terraform plan -detailed-exitcode -target=aws_sns_topic.cost_alerts \
                                     -target=aws_budgets_budget.monthly \
                                     -target=aws_budgets_budget.ecs_budget \
                                     -target=aws_budgets_budget.rds_budget \
                                     -target=aws_ce_anomaly_monitor.service_monitor \
                                     -target=aws_ce_anomaly_monitor.account_monitor \
                                     -target=aws_ce_anomaly_subscription.anomaly_alerts \
                                     > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Billing configuration is up to date${NC}"
elif [ $? -eq 2 ]; then
    echo -e "${YELLOW}⚠ Billing configuration has pending changes - run 'terraform apply'${NC}"
else
    echo -e "${RED}✗ Error checking Terraform plan${NC}"
fi

echo ""
echo -e "${GREEN}Validation complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Review any warnings above"
echo "  2. Confirm SNS email subscriptions if pending"
echo "  3. Run 'terraform apply' if changes detected"
echo "  4. Monitor Cost Explorer for the next 7-10 days"
echo ""
echo "Documentation: docs/COST_MONITORING_GUIDE.md"
