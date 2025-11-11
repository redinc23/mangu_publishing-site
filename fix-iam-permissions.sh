#!/bin/bash

###############################################################################
# Fix IAM Permissions for Terraform Deployment
#
# Your user needs these permissions to deploy infrastructure
###############################################################################

set -e

echo "🔧 IAM Permissions Required for Deployment"
echo ""
echo "Your AWS user 'namecityleggo' needs the following permissions:"
echo ""

cat << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:Describe*",
        "ec2:CreateVpc",
        "ec2:CreateSubnet",
        "ec2:CreateInternetGateway",
        "ec2:CreateNatGateway",
        "ec2:CreateSecurityGroup",
        "ec2:CreateRouteTable",
        "ec2:CreateRoute",
        "ec2:AssociateRouteTable",
        "ec2:AllocateAddress",
        "ec2:AuthorizeSecurityGroupIngress",
        "ec2:AuthorizeSecurityGroupEgress",
        "ec2:CreateTags",
        "ec2:DeleteVpc",
        "ec2:DeleteSubnet",
        "ec2:DeleteInternetGateway",
        "ec2:DeleteNatGateway",
        "ec2:DeleteSecurityGroup",
        "ec2:DeleteRouteTable",
        "ec2:DeleteRoute",
        "ec2:DisassociateRouteTable",
        "ec2:ReleaseAddress"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "rds:*",
        "elasticache:*",
        "ecs:*",
        "ecr:*",
        "elasticloadbalancing:*",
        "s3:*",
        "cloudfront:*",
        "wafv2:*",
        "secretsmanager:*",
        "logs:*",
        "iam:CreateRole",
        "iam:PutRolePolicy",
        "iam:AttachRolePolicy",
        "iam:GetRole",
        "iam:PassRole",
        "iam:DeleteRole",
        "iam:DeleteRolePolicy",
        "iam:DetachRolePolicy",
        "iam:ListRolePolicies",
        "iam:ListAttachedRolePolicies",
        "iam:CreatePolicy",
        "iam:GetPolicy",
        "iam:DeletePolicy",
        "applicationautoscaling:*",
        "cloudwatch:*"
      ],
      "Resource": "*"
    }
  ]
}
EOF

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "OPTION 1: Use AWS AdministratorAccess (Quick & Easy)"
echo "------------------------------------------------------------"
echo ""
echo "Run this command to attach admin access to your user:"
echo ""
echo "aws iam attach-user-policy \\"
echo "  --user-name namecityleggo \\"
echo "  --policy-arn arn:aws:iam::aws:policy/AdministratorAccess"
echo ""
echo "⚠️  WARNING: This gives full AWS access. Remove after deployment if needed."
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "OPTION 2: Create Custom Policy (More Secure)"
echo "------------------------------------------------------------"
echo ""
echo "1. Save the JSON policy above to: terraform-deploy-policy.json"
echo ""
echo "2. Create the policy:"
echo "   aws iam create-policy \\"
echo "     --policy-name TerraformDeploymentPolicy \\"
echo "     --policy-document file://terraform-deploy-policy.json"
echo ""
echo "3. Attach to your user:"
echo "   aws iam attach-user-policy \\"
echo "     --user-name namecityleggo \\"
echo "     --policy-arn arn:aws:iam::542993749514:policy/TerraformDeploymentPolicy"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""

read -p "Press Enter to run OPTION 1 (AdministratorAccess) or Ctrl+C to cancel..."

echo ""
echo "Adding AdministratorAccess to user 'namecityleggo'..."

if aws iam attach-user-policy \
    --user-name namecityleggo \
    --policy-arn arn:aws:iam::aws:policy/AdministratorAccess; then
    echo ""
    echo "✅ SUCCESS! AdministratorAccess policy attached"
    echo ""
    echo "You can now run:"
    echo "  ./deploy-to-production.sh"
    echo ""
    echo "⚠️  SECURITY NOTE: Remove this policy after deployment if not needed:"
    echo "  aws iam detach-user-policy --user-name namecityleggo --policy-arn arn:aws:iam::aws:policy/AdministratorAccess"
    echo ""
else
    echo ""
    echo "❌ Failed to attach policy. You may need to:"
    echo "   1. Have your AWS administrator grant you these permissions"
    echo "   2. Or login to AWS Console as root/admin and attach the policy manually"
    echo ""
fi

