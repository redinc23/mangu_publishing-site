# ACM Certificate CI/CD Quick Start

## TL;DR - Two-Phase Deployment

ACM certificate automation requires **manual DNS validation** between two Terraform applies when Route53 is not managed by Terraform.

```bash
# Phase 1: Request certificates
terraform apply  # Creates certificates → PENDING_VALIDATION

# Manual Step: Add DNS records (5-15 min)
terraform output cloudfront_dns_validation_records

# Phase 2: Complete validation and deploy
terraform apply  # Validates certificates → ISSUED, creates CloudFront/ALB
```

---

## GitHub Actions Example

### Option 1: Automated with Manual Approval

```yaml
name: Deploy Infrastructure

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  terraform-plan:
    runs-on: ubuntu-latest
    outputs:
      needs_validation: ${{ steps.check.outputs.needs_validation }}
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: us-east-1
      
      - name: Terraform Init
        run: |
          cd infrastructure/terraform
          terraform init
      
      - name: Terraform Plan
        run: |
          cd infrastructure/terraform
          terraform plan -out=tfplan
      
      - name: Check Certificate Status
        id: check
        run: |
          cd infrastructure/terraform
          STATUS=$(terraform output -raw cloudfront_certificate_status 2>/dev/null || echo "NONE")
          if [[ "$STATUS" == "PENDING_VALIDATION" ]]; then
            echo "needs_validation=true" >> $GITHUB_OUTPUT
            echo "::warning::⚠️  Certificate validation required"
          else
            echo "needs_validation=false" >> $GITHUB_OUTPUT
          fi
      
      - name: Upload Plan
        uses: actions/upload-artifact@v3
        with:
          name: tfplan
          path: infrastructure/terraform/tfplan

  # First apply - creates certificates
  terraform-apply-phase1:
    needs: terraform-plan
    if: needs.terraform-plan.outputs.needs_validation == 'true'
    runs-on: ubuntu-latest
    environment: production-phase1
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: us-east-1
      
      - name: Download Plan
        uses: actions/download-artifact@v3
        with:
          name: tfplan
          path: infrastructure/terraform/
      
      - name: Terraform Apply (Phase 1)
        run: |
          cd infrastructure/terraform
          terraform init
          terraform apply tfplan
      
      - name: Output DNS Validation Records
        id: dns_records
        run: |
          cd infrastructure/terraform
          echo "## 🔐 ACM Certificate Validation Required" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "Add these DNS records to your DNS provider:" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "### CloudFront Certificate" >> $GITHUB_STEP_SUMMARY
          terraform output -json cloudfront_dns_validation_records | jq -r '.[] | "- **\(.domain_name)**: `\(.name)` → `\(.value)`"' >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "### ALB Certificate" >> $GITHUB_STEP_SUMMARY
          terraform output -json alb_dns_validation_records | jq -r '.[] | "- **\(.domain_name)**: `\(.name)` → `\(.value)`"' >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "⏱️  Wait 5-15 minutes for DNS propagation, then trigger Phase 2 workflow" >> $GITHUB_STEP_SUMMARY
      
      - name: Create Issue for DNS Validation
        uses: actions/github-script@v6
        with:
          script: |
            const records = JSON.parse('${{ steps.dns_records.outputs.records }}');
            const issue = await github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: '🔐 ACM Certificate DNS Validation Required',
              body: `## Action Required: Add DNS Records
              
              ACM certificates have been requested and require DNS validation.
              
              ### CloudFront Certificate
              \`\`\`
              terraform output cloudfront_dns_validation_records
              \`\`\`
              
              ### ALB Certificate
              \`\`\`
              terraform output alb_dns_validation_records
              \`\`\`
              
              ### Next Steps:
              1. ✅ Add the CNAME records to your DNS provider
              2. ⏱️  Wait 5-15 minutes for DNS propagation
              3. ▶️  Trigger the **Deploy Phase 2** workflow
              4. 🚀 Phase 2 will validate certificates and complete deployment
              
              **Workflow Run**: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}
              **Environment**: production-phase1
              `,
              labels: ['infrastructure', 'certificates', 'action-required']
            });
            console.log('Created issue #' + issue.data.number);

  # Second apply - validates and deploys
  terraform-apply-phase2:
    needs: terraform-plan
    if: needs.terraform-plan.outputs.needs_validation == 'false'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: us-east-1
      
      - name: Download Plan
        uses: actions/download-artifact@v3
        with:
          name: tfplan
          path: infrastructure/terraform/
      
      - name: Terraform Apply (Phase 2)
        run: |
          cd infrastructure/terraform
          terraform init
          terraform apply tfplan
      
      - name: Deployment Summary
        run: |
          cd infrastructure/terraform
          echo "## ✅ Deployment Complete" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "### Infrastructure Outputs" >> $GITHUB_STEP_SUMMARY
          echo "- **CloudFront**: $(terraform output -raw cloudfront_domain_name)" >> $GITHUB_STEP_SUMMARY
          echo "- **ALB**: $(terraform output -raw alb_dns_name)" >> $GITHUB_STEP_SUMMARY
          echo "- **CloudFront Cert Status**: $(terraform output -raw cloudfront_certificate_status)" >> $GITHUB_STEP_SUMMARY
          echo "- **ALB Cert Status**: $(terraform output -raw alb_certificate_status)" >> $GITHUB_STEP_SUMMARY
```

### Option 2: Separate Workflows (Simpler)

**Workflow 1: `terraform-apply-phase1.yml`**

```yaml
name: Terraform Phase 1 - Request Certificates

on:
  workflow_dispatch:

jobs:
  apply:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS
        uses: aws-actions/configure-aws-credentials@v2
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: us-east-1
      
      - name: Terraform Apply
        run: |
          cd infrastructure/terraform
          terraform init
          terraform apply -auto-approve
      
      - name: Output DNS Records
        run: |
          cd infrastructure/terraform
          terraform output cloudfront_dns_validation_records
          terraform output alb_dns_validation_records
```

**Workflow 2: `terraform-apply-phase2.yml`**

```yaml
name: Terraform Phase 2 - Validate & Deploy

on:
  workflow_dispatch:

jobs:
  apply:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS
        uses: aws-actions/configure-aws-credentials@v2
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: us-east-1
      
      - name: Check Certificate Status
        run: |
          cd infrastructure/terraform
          terraform init
          STATUS=$(terraform output -raw cloudfront_certificate_status)
          if [[ "$STATUS" != "ISSUED" ]]; then
            echo "::error::Certificate not yet validated. Status: $STATUS"
            exit 1
          fi
      
      - name: Terraform Apply
        run: |
          cd infrastructure/terraform
          terraform apply -auto-approve
```

---

## GitLab CI Example

```yaml
# .gitlab-ci.yml
stages:
  - validate
  - apply-phase1
  - wait
  - apply-phase2

variables:
  TF_ROOT: infrastructure/terraform

terraform-init:
  stage: validate
  image: hashicorp/terraform:latest
  script:
    - cd $TF_ROOT
    - terraform init
  cache:
    paths:
      - $TF_ROOT/.terraform

terraform-plan:
  stage: validate
  image: hashicorp/terraform:latest
  script:
    - cd $TF_ROOT
    - terraform init
    - terraform plan -out=tfplan
  artifacts:
    paths:
      - $TF_ROOT/tfplan

terraform-apply-phase1:
  stage: apply-phase1
  image: hashicorp/terraform:latest
  script:
    - cd $TF_ROOT
    - terraform init
    - terraform apply -auto-approve
    - |
      echo "DNS Validation Records:"
      terraform output cloudfront_dns_validation_records
      terraform output alb_dns_validation_records
  only:
    - main
  when: manual

wait-for-dns:
  stage: wait
  image: alpine:latest
  script:
    - echo "⏱️  Add DNS records from previous job output"
    - echo "⏱️  Wait 5-15 minutes for propagation"
    - echo "▶️  Then manually trigger Phase 2"
  when: manual

terraform-apply-phase2:
  stage: apply-phase2
  image: hashicorp/terraform:latest
  script:
    - cd $TF_ROOT
    - terraform init
    - STATUS=$(terraform output -raw cloudfront_certificate_status || echo "NONE")
    - |
      if [ "$STATUS" != "ISSUED" ]; then
        echo "Certificate not validated yet: $STATUS"
        exit 1
      fi
    - terraform apply -auto-approve
  only:
    - main
  when: manual
```

---

## Jenkins Pipeline Example

```groovy
pipeline {
    agent any
    
    parameters {
        choice(
            name: 'PHASE',
            choices: ['phase1-request', 'phase2-validate'],
            description: 'Deployment phase'
        )
    }
    
    environment {
        AWS_REGION = 'us-east-1'
        TF_DIR = 'infrastructure/terraform'
    }
    
    stages {
        stage('Terraform Init') {
            steps {
                dir(env.TF_DIR) {
                    sh 'terraform init'
                }
            }
        }
        
        stage('Phase 1: Request Certificates') {
            when {
                expression { params.PHASE == 'phase1-request' }
            }
            steps {
                dir(env.TF_DIR) {
                    sh 'terraform apply -auto-approve'
                    
                    script {
                        def dnsRecords = sh(
                            script: 'terraform output -json cloudfront_dns_validation_records',
                            returnStdout: true
                        )
                        echo "DNS Records to add:\n${dnsRecords}"
                        
                        currentBuild.description = "⏱️ Waiting for DNS validation"
                    }
                }
            }
        }
        
        stage('Phase 2: Validate & Deploy') {
            when {
                expression { params.PHASE == 'phase2-validate' }
            }
            steps {
                dir(env.TF_DIR) {
                    script {
                        def status = sh(
                            script: 'terraform output -raw cloudfront_certificate_status',
                            returnStdout: true
                        ).trim()
                        
                        if (status != 'ISSUED') {
                            error("Certificate not validated. Status: ${status}")
                        }
                    }
                    
                    sh 'terraform apply -auto-approve'
                    
                    script {
                        currentBuild.description = "✅ Deployment complete"
                    }
                }
            }
        }
    }
    
    post {
        success {
            script {
                if (params.PHASE == 'phase1-request') {
                    slackSend(
                        color: 'warning',
                        message: "🔐 ACM certificates requested. Add DNS records and run Phase 2.\n${BUILD_URL}"
                    )
                } else {
                    slackSend(
                        color: 'good',
                        message: "✅ Infrastructure deployed successfully!\n${BUILD_URL}"
                    )
                }
            }
        }
    }
}
```

---

## CircleCI Example

```yaml
# .circleci/config.yml
version: 2.1

orbs:
  terraform: circleci/terraform@3.2.0

jobs:
  terraform-phase1:
    docker:
      - image: hashicorp/terraform:latest
    steps:
      - checkout
      - run:
          name: Terraform Init
          command: |
            cd infrastructure/terraform
            terraform init
      - run:
          name: Terraform Apply Phase 1
          command: |
            cd infrastructure/terraform
            terraform apply -auto-approve
      - run:
          name: Output DNS Records
          command: |
            cd infrastructure/terraform
            echo "Add these DNS records:"
            terraform output cloudfront_dns_validation_records
            terraform output alb_dns_validation_records
      - run:
          name: Save State
          command: |
            cd infrastructure/terraform
            terraform output -json > /tmp/tf-outputs.json
      - store_artifacts:
          path: /tmp/tf-outputs.json

  terraform-phase2:
    docker:
      - image: hashicorp/terraform:latest
    steps:
      - checkout
      - run:
          name: Terraform Init
          command: |
            cd infrastructure/terraform
            terraform init
      - run:
          name: Check Certificate Status
          command: |
            cd infrastructure/terraform
            STATUS=$(terraform output -raw cloudfront_certificate_status)
            if [ "$STATUS" != "ISSUED" ]; then
              echo "Certificate not validated: $STATUS"
              exit 1
            fi
      - run:
          name: Terraform Apply Phase 2
          command: |
            cd infrastructure/terraform
            terraform apply -auto-approve

workflows:
  deploy:
    jobs:
      - terraform-phase1:
          filters:
            branches:
              only: main
      - hold-for-dns:
          type: approval
          requires:
            - terraform-phase1
      - terraform-phase2:
          requires:
            - hold-for-dns
```

---

## AWS CodePipeline Example

**buildspec-phase1.yml**

```yaml
version: 0.2

phases:
  install:
    runtime-versions:
      terraform: 1.5
  pre_build:
    commands:
      - cd infrastructure/terraform
      - terraform init
  build:
    commands:
      - terraform apply -auto-approve
  post_build:
    commands:
      - terraform output cloudfront_dns_validation_records
      - terraform output alb_dns_validation_records

artifacts:
  files:
    - infrastructure/terraform/terraform.tfstate
```

**buildspec-phase2.yml**

```yaml
version: 0.2

phases:
  install:
    runtime-versions:
      terraform: 1.5
  pre_build:
    commands:
      - cd infrastructure/terraform
      - terraform init
      - STATUS=$(terraform output -raw cloudfront_certificate_status)
      - |
        if [ "$STATUS" != "ISSUED" ]; then
          echo "Certificate not validated: $STATUS"
          exit 1
        fi
  build:
    commands:
      - terraform apply -auto-approve
```

---

## Terraform Cloud Example

**Workspace Settings:**

1. **Create two workspaces:**
   - `mangu-production-phase1` (auto-apply enabled)
   - `mangu-production-phase2` (manual apply)

2. **Configure workspace variables:**
   ```
   TF_VAR_create_acm_certificate = true
   TF_VAR_domain_name = mangu-publishing.com
   AWS_REGION = us-east-1
   ```

3. **Workflow:**
   - Push to `main` → triggers `phase1` workspace
   - Phase 1 applies → outputs DNS records
   - Ops adds DNS records
   - Manually trigger `phase2` workspace
   - Phase 2 validates → deploys infrastructure

---

## Quick Tips

### 1. Check if validation is needed
```bash
terraform output cloudfront_certificate_status
# Output: PENDING_VALIDATION → need DNS records
# Output: ISSUED → ready for phase 2
```

### 2. Extract DNS records for automation
```bash
terraform output -json cloudfront_dns_validation_records | \
  jq -r '.[] | "\(.name) CNAME \(.value)"'
```

### 3. Verify DNS propagation before phase 2
```bash
dig $(terraform output -json cloudfront_dns_validation_records | jq -r '.[0].name') CNAME +short
```

### 4. Force refresh certificate status
```bash
terraform refresh
terraform output cloudfront_certificate_status
```

### 5. Skip certificate creation (use existing)
```hcl
# terraform.tfvars
create_acm_certificate = false
certificate_arn = "arn:aws:acm:us-east-1:123456789012:certificate/abc-123"
```

---

## Common CI/CD Patterns

### Pattern 1: Fail Fast (Recommended)
- Phase 1 creates certificates
- Pipeline **fails** with DNS instructions
- Human adds DNS
- Re-run pipeline → Phase 2 succeeds

### Pattern 2: Manual Approval Gate
- Phase 1 creates certificates
- Workflow **pauses** at approval gate
- Human adds DNS, approves
- Phase 2 runs automatically

### Pattern 3: Separate Workflows
- Workflow A: Certificate request (manual trigger)
- Human adds DNS
- Workflow B: Full deploy (manual trigger)

### Pattern 4: Polling (Not Recommended)
- Phase 1 creates certificates
- Script polls certificate status
- Auto-proceeds when ISSUED
- **Issue**: Wastes CI minutes, unpredictable timing

---

## Troubleshooting CI/CD

### Issue: "Certificate still PENDING_VALIDATION"
```bash
# In CI job
terraform init
terraform refresh
STATUS=$(terraform output -raw cloudfront_certificate_status)
echo "Certificate status: $STATUS"

# Check DNS from CI runner
dig _abc.mangu-publishing.com CNAME +short
```

### Issue: "Cannot parse empty output"
```bash
# Handle empty outputs gracefully
STATUS=$(terraform output -raw cloudfront_certificate_status 2>/dev/null || echo "NONE")
```

### Issue: "Terraform state out of sync"
```bash
# Always init before checking status
terraform init
terraform refresh
terraform output cloudfront_certificate_status
```

---

## Summary

✅ **Two-phase deployment is required** when DNS is not managed by Terraform
✅ **Phase 1**: Request certificates → output DNS records
✅ **Manual step**: Add DNS records (5-15 minutes)
✅ **Phase 2**: Validate certificates → deploy infrastructure

Choose the CI/CD pattern that fits your team's workflow. Most teams prefer **manual approval gates** or **separate workflows** for production deployments.
