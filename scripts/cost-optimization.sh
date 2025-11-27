#!/bin/bash
set -euo pipefail

# MANGU Publishing - AWS Cost Optimization Script
# Analyzes current spend and provides optimization recommendations

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  MANGU Publishing - Cost Optimization Analysis${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found. Please install it first.${NC}"
    exit 1
fi

# Get account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text 2>/dev/null || echo "unknown")
echo -e "${GREEN}✓${NC} AWS Account: ${ACCOUNT_ID}"

# Get current month dates
MONTH_START=$(date -u +"%Y-%m-01")
TODAY=$(date -u +"%Y-%m-%d")
LAST_MONTH_START=$(date -u -d "$(date +%Y-%m-01) -1 month" +"%Y-%m-01")
LAST_MONTH_END=$(date -u -d "$(date +%Y-%m-01) -1 day" +"%Y-%m-%d")

echo -e "${GREEN}✓${NC} Analysis Period: ${MONTH_START} to ${TODAY}"
echo

# Function to format currency
format_currency() {
    printf "$%.2f" "$1"
}

# 1. Current Month Spend
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}1. Current Month Spend${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

CURRENT_SPEND=$(aws ce get-cost-and-usage \
    --time-period Start="${MONTH_START}",End="${TODAY}" \
    --granularity MONTHLY \
    --metrics BlendedCost \
    --query 'ResultsByTime[0].Total.BlendedCost.Amount' \
    --output text 2>/dev/null || echo "0")

BUDGET_LIMIT=500
SPEND_PERCENTAGE=$(echo "scale=1; ($CURRENT_SPEND / $BUDGET_LIMIT) * 100" | bc)

echo -e "Current Spend: ${GREEN}\$${CURRENT_SPEND}${NC}"
echo -e "Monthly Budget: \$${BUDGET_LIMIT}"
echo -e "Usage: ${YELLOW}${SPEND_PERCENTAGE}%${NC}"
echo

if (( $(echo "$CURRENT_SPEND > 400" | bc -l) )); then
    echo -e "${RED}⚠️  WARNING: Approaching budget limit!${NC}"
    echo
fi

# 2. Spend by Service
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}2. Top 10 Services by Cost${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

aws ce get-cost-and-usage \
    --time-period Start="${MONTH_START}",End="${TODAY}" \
    --granularity MONTHLY \
    --metrics BlendedCost \
    --group-by Type=DIMENSION,Key=SERVICE \
    --query 'ResultsByTime[0].Groups[].[Keys[0], Total.BlendedCost.Amount]' \
    --output text 2>/dev/null | \
    sort -k2 -nr | \
    head -10 | \
    awk '{printf "%-45s $%.2f\n", $1, $2}' || echo "No data available"
echo

# 3. Month-over-Month Comparison
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}3. Month-over-Month Comparison${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

LAST_MONTH_SPEND=$(aws ce get-cost-and-usage \
    --time-period Start="${LAST_MONTH_START}",End="${LAST_MONTH_END}" \
    --granularity MONTHLY \
    --metrics BlendedCost \
    --query 'ResultsByTime[0].Total.BlendedCost.Amount' \
    --output text 2>/dev/null || echo "0")

if (( $(echo "$LAST_MONTH_SPEND > 0" | bc -l) )); then
    CHANGE=$(echo "scale=2; $CURRENT_SPEND - $LAST_MONTH_SPEND" | bc)
    CHANGE_PCT=$(echo "scale=1; ($CHANGE / $LAST_MONTH_SPEND) * 100" | bc)
    
    echo -e "Last Month: \$${LAST_MONTH_SPEND}"
    echo -e "This Month (so far): \$${CURRENT_SPEND}"
    
    if (( $(echo "$CHANGE > 0" | bc -l) )); then
        echo -e "Change: ${RED}+\$${CHANGE} (+${CHANGE_PCT}%)${NC}"
    else
        echo -e "Change: ${GREEN}\$${CHANGE} (${CHANGE_PCT}%)${NC}"
    fi
else
    echo -e "No data for last month"
fi
echo

# 4. Budget Status
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}4. Budget Status${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

aws budgets describe-budgets --account-id "${ACCOUNT_ID}" \
    --query 'Budgets[?BudgetName==`mangu-publishing-monthly-budget-production`].[BudgetName, BudgetLimit.Amount, CalculatedSpend.ActualSpend.Amount]' \
    --output text 2>/dev/null | \
    awk '{printf "Budget: %s\nLimit: $%s\nActual: $%s\n", $1, $2, $3}' || echo "No budget configured"
echo

# 5. Cost Anomalies
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}5. Recent Cost Anomalies${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

ANOMALIES=$(aws ce get-anomalies --max-results 5 \
    --query 'Anomalies[?AnomalyScore.MaxScore > `5`].[AnomalyStartDate, RootCauses[0].Service, Impact.TotalImpact]' \
    --output text 2>/dev/null)

if [ -n "$ANOMALIES" ] && [ "$ANOMALIES" != "None" ]; then
    echo "$ANOMALIES" | awk '{printf "%s | %-30s | Impact: $%.2f\n", $1, $2, $3}'
else
    echo -e "${GREEN}✓${NC} No significant anomalies detected"
fi
echo

# 6. Optimization Recommendations
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}6. Optimization Recommendations${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Check ECS utilization
echo -e "${YELLOW}▶${NC} Checking ECS task utilization..."
ECS_CLUSTERS=$(aws ecs list-clusters --query 'clusterArns[*]' --output text 2>/dev/null)
if [ -n "$ECS_CLUSTERS" ]; then
    for cluster in $ECS_CLUSTERS; do
        CLUSTER_NAME=$(basename "$cluster")
        TASK_COUNT=$(aws ecs list-tasks --cluster "$CLUSTER_NAME" --query 'length(taskArns)' --output text 2>/dev/null || echo "0")
        
        if [ "$TASK_COUNT" -gt 0 ]; then
            echo "  • Cluster: $CLUSTER_NAME - $TASK_COUNT tasks running"
            echo "    Recommendation: Review task CPU/Memory utilization and right-size"
        fi
    done
else
    echo "  No ECS clusters found"
fi
echo

# Check RDS instances
echo -e "${YELLOW}▶${NC} Checking RDS instances..."
RDS_INSTANCES=$(aws rds describe-db-instances \
    --query 'DBInstances[?DBInstanceStatus==`available`].[DBInstanceIdentifier, DBInstanceClass, AllocatedStorage]' \
    --output text 2>/dev/null)

if [ -n "$RDS_INSTANCES" ]; then
    echo "$RDS_INSTANCES" | while read -r instance class storage; do
        echo "  • Instance: $instance | Class: $class | Storage: ${storage}GB"
        
        if [[ "$class" == *"t3.small"* ]] || [[ "$class" == *"t3.medium"* ]]; then
            echo "    ${GREEN}✓${NC} Good choice for dev/staging"
        fi
        
        echo "    Recommendation: Consider Reserved Instances for 30-40% savings"
    done
else
    echo "  No RDS instances found"
fi
echo

# Check ElastiCache
echo -e "${YELLOW}▶${NC} Checking ElastiCache clusters..."
REDIS_CLUSTERS=$(aws elasticache describe-cache-clusters \
    --query 'CacheClusters[?CacheClusterStatus==`available`].[CacheClusterId, CacheNodeType, NumCacheNodes]' \
    --output text 2>/dev/null)

if [ -n "$REDIS_CLUSTERS" ]; then
    echo "$REDIS_CLUSTERS" | while read -r cluster node_type num_nodes; do
        echo "  • Cluster: $cluster | Type: $node_type | Nodes: $num_nodes"
        
        if [ "$num_nodes" -gt 1 ]; then
            echo "    ${YELLOW}⚠${NC}  Consider single node for non-production environments"
        fi
    done
else
    echo "  No ElastiCache clusters found"
fi
echo

# Check S3 storage
echo -e "${YELLOW}▶${NC} Checking S3 buckets..."
S3_BUCKETS=$(aws s3 ls 2>/dev/null | wc -l || echo "0")
if [ "$S3_BUCKETS" -gt 0 ]; then
    echo "  • Found $S3_BUCKETS buckets"
    echo "    Recommendation: Implement lifecycle policies for old objects"
    echo "    • Move infrequent access data to S3 IA after 30 days"
    echo "    • Archive to Glacier after 90 days"
fi
echo

# Check CloudWatch logs retention
echo -e "${YELLOW}▶${NC} Checking CloudWatch Logs retention..."
LOG_GROUPS=$(aws logs describe-log-groups \
    --query 'logGroups[?retentionInDays==`null` || retentionInDays > `90`].[logGroupName, retentionInDays]' \
    --output text 2>/dev/null | wc -l || echo "0")

if [ "$LOG_GROUPS" -gt 0 ]; then
    echo "  • Found $LOG_GROUPS log groups with long/no retention"
    echo "    ${YELLOW}⚠${NC}  Recommendation: Set 30-90 day retention for most logs"
fi
echo

# 7. Quick Wins
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}7. Quick Cost Optimization Wins${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

cat <<EOF
1. ${GREEN}Enable AWS Cost Anomaly Detection${NC}
   Already configured via Terraform - monitor SNS alerts

2. ${GREEN}Use Reserved Instances / Savings Plans${NC}
   Potential savings: 30-40% on RDS, 20-30% on ECS
   Command: aws ec2 describe-reserved-instances-offerings

3. ${GREEN}Implement S3 Lifecycle Policies${NC}
   Move to S3-IA after 30 days: 50% cost reduction
   Archive to Glacier after 90 days: 85% cost reduction

4. ${GREEN}Set CloudWatch Logs Retention${NC}
   Default retention: indefinite (expensive)
   Recommended: 30 days for most logs
   Command: aws logs put-retention-policy --log-group-name <name> --retention-in-days 30

5. ${GREEN}Enable ECS Task Auto-Scaling${NC}
   Scale based on CPU/Memory metrics
   Avoid over-provisioning during low traffic

6. ${GREEN}Use CloudFront for Static Assets${NC}
   Reduce ECS/ALB bandwidth costs
   Enable compression for 60-80% bandwidth savings

7. ${GREEN}Delete Unused Resources${NC}
   • Unattached EBS volumes
   • Unused Elastic IPs (\$3.60/month each)
   • Old EBS snapshots
   • Unused NAT Gateways (\$32/month each)

8. ${GREEN}Enable RDS Storage Auto-Scaling${NC}
   Pay only for storage you use
   Set max limit to prevent runaway costs

EOF

# 8. Action Items
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}8. Immediate Action Items${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if (( $(echo "$SPEND_PERCENTAGE > 80" | bc -l) )); then
    echo -e "${RED}🔴 CRITICAL: Budget at ${SPEND_PERCENTAGE}%${NC}"
    echo "   1. Review ECS task counts and scale down if possible"
    echo "   2. Check for anomalies in CloudWatch dashboard"
    echo "   3. Review recent deployments for cost impact"
    echo
fi

if (( $(echo "$SPEND_PERCENTAGE > 60" | bc -l) && $(echo "$SPEND_PERCENTAGE <= 80" | bc -l) )); then
    echo -e "${YELLOW}⚠️  WARNING: Budget at ${SPEND_PERCENTAGE}%${NC}"
    echo "   1. Monitor daily spend trends"
    echo "   2. Plan optimization for next billing cycle"
    echo
fi

if (( $(echo "$SPEND_PERCENTAGE <= 60" | bc -l) )); then
    echo -e "${GREEN}✓ Budget on track: ${SPEND_PERCENTAGE}%${NC}"
    echo "   Continue monitoring and optimize for better margins"
    echo
fi

# 9. Useful Commands
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}9. Useful Cost Management Commands${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

cat <<'EOF'
# Daily cost trend
aws ce get-cost-and-usage \
  --time-period Start=2025-01-01,End=2025-02-01 \
  --granularity DAILY \
  --metrics BlendedCost

# Cost by resource tag
aws ce get-cost-and-usage \
  --time-period Start=2025-01-01,End=2025-02-01 \
  --granularity MONTHLY \
  --group-by Type=TAG,Key=Environment

# Find unused resources
# Unattached volumes
aws ec2 describe-volumes --filters Name=status,Values=available

# Unused Elastic IPs
aws ec2 describe-addresses --query 'Addresses[?AssociationId==null]'

# Set log retention
for log_group in $(aws logs describe-log-groups --query 'logGroups[].logGroupName' --output text); do
  aws logs put-retention-policy --log-group-name "$log_group" --retention-in-days 30
done

# View cost dashboard
terraform output cost_dashboard_url

EOF

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Analysis Complete - $(date)${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo
echo -e "For detailed analysis, visit:"
echo -e "• Cost Explorer: https://console.aws.amazon.com/cost-management/home"
echo -e "• CloudWatch Dashboard: \$(terraform -chdir=infrastructure/terraform output -raw cost_dashboard_url)"
echo
