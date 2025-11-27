# Domain Setup Status

## Current Status

### ✅ Completed

1. **Route53 Hosted Zone Created**
   - Zone ID: `Z04839491ZLMW27Z17F07`
   - Domain: `publishing.mangu.com`

2. **ACM Certificates Requested**
   - CloudFront certificate: Created (pending validation)
   - ALB certificate: Created (pending validation)

3. **DNS Validation Records Created**
   - Validation records created in Route53 for both certificates
   - Records are waiting for nameserver update at registrar

4. **Route53 Nameservers**
   ```
   ns-1162.awsdns-17.org
   ns-1934.awsdns-49.co.uk
   ns-375.awsdns-46.com
   ns-950.awsdns-54.net
   ```

### ⏳ Pending

1. **Update Domain Registrar Nameservers** (Manual Step Required)
   - Update nameservers at your domain registrar to the Route53 nameservers above
   - This will allow ACM to validate certificates automatically

2. **DNS A Records for CloudFront**
   - Will be created automatically after certificate validation completes
   - Currently blocked because certificates are pending validation

3. **Certificate Validation**
   - Certificates will auto-validate once nameservers are updated
   - Usually takes 5-30 minutes after nameserver update

## Next Steps

### Step 1: Update Nameservers at Domain Registrar

1. Log in to your domain registrar (where `publishing.mangu.com` is registered)
2. Navigate to DNS/Nameserver settings
3. Replace existing nameservers with:
   ```
   ns-1162.awsdns-17.org
   ns-1934.awsdns-49.co.uk
   ns-375.awsdns-46.com
   ns-950.awsdns-54.net
   ```
4. Save changes

**Note**: DNS propagation can take 24-48 hours, but certificate validation usually works within 5-30 minutes.

### Step 2: Wait for Certificate Validation

After updating nameservers, Terraform will automatically validate certificates on the next apply. You can check status:

```bash
cd infrastructure/terraform
terraform apply
```

Or check certificate status directly:
```bash
aws acm list-certificates --region us-east-1 --query 'CertificateSummaryList[?DomainName==`publishing.mangu.com`]'
```

### Step 3: Complete DNS A Records Creation

Once certificates are validated, run terraform apply again to create DNS A records pointing to CloudFront:

```bash
cd infrastructure/terraform
terraform apply
```

This will create:
- DNS A record for `publishing.mangu.com` → CloudFront
- DNS A record for `www.publishing.mangu.com` → CloudFront

### Step 4: Verify DNS Propagation

After DNS A records are created, verify DNS resolution:

```bash
dig publishing.mangu.com +short
dig www.publishing.mangu.com +short
```

Should return CloudFront distribution IP addresses.

### Step 5: Verify SSL and Application

```bash
# Test HTTPS
curl -I https://publishing.mangu.com

# Run verification script
cd /Users/redinc23gmail.com/projects/mangu2-publishing
BASE_URL=https://publishing.mangu.com ./verify-tool.sh
```

## Troubleshooting

### Certificates Still Pending Validation

If certificates remain in PENDING_VALIDATION after updating nameservers:

1. Verify nameservers are updated at registrar
2. Wait 5-30 minutes for DNS propagation
3. Check validation records exist:
   ```bash
   aws route53 list-resource-record-sets --hosted-zone-id Z04839491ZLMW27Z17F07 | grep acm
   ```
4. Re-run terraform apply to trigger validation

### DNS Not Resolving

1. Verify nameservers updated at registrar
2. Wait 24-48 hours for full DNS propagation
3. Check Route53 hosted zone:
   ```bash
   aws route53 get-hosted-zone --id Z04839491ZLMW27Z17F07
   ```

## Summary

**What's Done:**
- ✅ Route53 hosted zone created
- ✅ ACM certificates requested
- ✅ DNS validation records created
- ✅ Nameservers obtained

**What's Needed:**
- ⏳ Update nameservers at domain registrar (manual)
- ⏳ Wait for certificate validation (automatic after nameserver update)
- ⏳ Create DNS A records (automatic after validation)
- ⏳ Verify DNS propagation and SSL

**Estimated Time:**
- Nameserver update: 5 minutes
- Certificate validation: 5-30 minutes
- DNS propagation: 1-48 hours (usually 1-2 hours)



