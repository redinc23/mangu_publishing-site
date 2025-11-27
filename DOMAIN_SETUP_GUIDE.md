# Domain Setup Guide for MANGU Publishing

This guide walks you through integrating your purchased domain with your MANGU Publishing application, including DNS configuration and SSL certificate setup.

## Prerequisites

- A domain name purchased from a registrar (GoDaddy, Namecheap, Cloudflare, Route53, etc.)
- AWS account with appropriate permissions (if using AWS Route53 and ACM)
- Access to your domain registrar's DNS management panel
- Your application deployed and accessible via IP address or load balancer

---

## Step 1: Choose Your DNS Provider

### Option A: AWS Route53 (Recommended for AWS deployments)
- Best for: Applications hosted on AWS (ECS, EC2, ALB, CloudFront)
- Pros: Integrated with AWS services, automatic SSL via ACM, easy management
- Cons: Costs ~$0.50/month per hosted zone

### Option B: Cloudflare
- Best for: Any hosting provider, free SSL, CDN included
- Pros: Free SSL certificates, DDoS protection, CDN
- Cons: Requires changing nameservers

### Option C: Your Domain Registrar
- Best for: Simple setups, keeping everything in one place
- Pros: No additional setup
- Cons: Limited features, manual SSL setup

---

## Step 2: DNS Configuration

### For AWS Route53

1. **Create a Hosted Zone**
   ```bash
   aws route53 create-hosted-zone \
     --name yourdomain.com \
     --caller-reference $(date +%s)
   ```

2. **Get Name Servers**
   ```bash
   aws route53 get-hosted-zone --id <HOSTED_ZONE_ID> \
     --query 'DelegationSet.NameServers' --output table
   ```

3. **Update Nameservers at Registrar**
   - Go to your domain registrar
   - Update nameservers to the ones from Route53
   - Wait 24-48 hours for propagation

4. **Create DNS Records**

   **For Application Load Balancer (ALB):**
   ```bash
   # A Record (Alias)
   aws route53 change-resource-record-sets \
     --hosted-zone-id <ZONE_ID> \
     --change-batch '{
       "Changes": [{
         "Action": "CREATE",
         "ResourceRecordSet": {
           "Name": "yourdomain.com",
           "Type": "A",
           "AliasTarget": {
             "DNSName": "<ALB_DNS_NAME>",
             "EvaluateTargetHealth": true,
             "HostedZoneId": "<ALB_ZONE_ID>"
           }
         }
       }]
     }'
   ```

   **For EC2 Instance (Direct IP):**
   ```bash
   # A Record
   aws route53 change-resource-record-sets \
     --hosted-zone-id <ZONE_ID> \
     --change-batch '{
       "Changes": [{
         "Action": "CREATE",
         "ResourceRecordSet": {
           "Name": "yourdomain.com",
           "Type": "A",
           "TTL": 300,
           "ResourceRecords": [{"Value": "<YOUR_IP_ADDRESS>"}]
         }
       }]
     }'
   ```

   **For www subdomain:**
   ```bash
   # CNAME Record
   aws route53 change-resource-record-sets \
     --hosted-zone-id <ZONE_ID> \
     --change-batch '{
       "Changes": [{
         "Action": "CREATE",
         "ResourceRecordSet": {
           "Name": "www.yourdomain.com",
           "Type": "CNAME",
           "TTL": 300,
           "ResourceRecords": [{"Value": "yourdomain.com"}]
         }
       }]
     }'
   ```

### For Cloudflare

1. **Add Site to Cloudflare**
   - Sign up/login at cloudflare.com
   - Add your domain
   - Choose Free plan

2. **Update Nameservers**
   - Cloudflare will provide nameservers
   - Update at your domain registrar
   - Wait for activation

3. **Configure DNS Records**
   - Go to DNS → Records
   - Add A record: `@` → Your IP address
   - Add CNAME record: `www` → `yourdomain.com`
   - Enable "Proxy" (orange cloud) for CDN and DDoS protection

### For Generic DNS Provider

1. **Add A Record**
   - Type: A
   - Name: `@` or blank (for root domain)
   - Value: Your server IP address
   - TTL: 300 (5 minutes) or 3600 (1 hour)

2. **Add CNAME Record**
   - Type: CNAME
   - Name: `www`
   - Value: `yourdomain.com` or `@`
   - TTL: 300

3. **Verify DNS Propagation**
   ```bash
   dig yourdomain.com
   dig www.yourdomain.com
   ```

---

## Step 3: SSL Certificate Configuration

### Option A: AWS Certificate Manager (ACM) - Recommended for AWS

**For Application Load Balancer:**

1. **Request Certificate**
   ```bash
   aws acm request-certificate \
     --domain-name yourdomain.com \
     --subject-alternative-names www.yourdomain.com \
     --validation-method DNS \
     --region us-east-1
   ```

2. **Get Validation Records**
   ```bash
   aws acm describe-certificate \
     --certificate-arn <CERT_ARN> \
     --region us-east-1 \
     --query 'Certificate.DomainValidationOptions'
   ```

3. **Add DNS Validation Records**
   - Add CNAME records to Route53 for validation
   - Wait for validation (usually 5-30 minutes)

4. **Attach to Load Balancer**
   - Go to EC2 → Load Balancers
   - Edit listeners
   - Add HTTPS listener on port 443
   - Select your certificate
   - Redirect HTTP (80) to HTTPS (443)

**For CloudFront:**
- ACM certificates for CloudFront must be in `us-east-1` region
- Follow same steps but ensure region is `us-east-1`

### Option B: Let's Encrypt with Certbot

**For EC2/Standalone Server:**

1. **Install Certbot**
   ```bash
   # Ubuntu/Debian
   sudo apt-get update
   sudo apt-get install certbot

   # Amazon Linux 2 / CentOS
   sudo yum install epel-release
   sudo yum install certbot
   ```

2. **Obtain Certificate**
   ```bash
   sudo certbot certonly --standalone \
     -d yourdomain.com \
     -d www.yourdomain.com \
     --email your-email@example.com \
     --agree-tos \
     --non-interactive
   ```

3. **Auto-renewal Setup**
   ```bash
   # Test renewal
   sudo certbot renew --dry-run

   # Add to crontab (runs twice daily)
   echo "0 0,12 * * * root certbot renew --quiet" | sudo tee -a /etc/crontab
   ```

4. **Configure Nginx/Express**
   
   **Nginx Example:**
   ```nginx
   server {
       listen 443 ssl http2;
       server_name yourdomain.com www.yourdomain.com;

       ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

       location / {
           proxy_pass http://localhost:3001;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }

   server {
       listen 80;
       server_name yourdomain.com www.yourdomain.com;
       return 301 https://$server_name$request_uri;
   }
   ```

### Option C: Cloudflare SSL (Automatic)

- Cloudflare provides free SSL automatically
- Set SSL/TLS mode to "Full" or "Full (strict)"
- No certificate installation needed on your server
- Works with Cloudflare's proxy

---

## Step 4: Update Application Configuration

### Environment Variables

Update your production environment variables:

```bash
# .env.production
DOMAIN=yourdomain.com
CLIENT_URL=https://yourdomain.com
API_URL=https://api.yourdomain.com  # or https://yourdomain.com/api
NODE_ENV=production
```

### CORS Configuration

Ensure your backend allows your domain:

```javascript
// server/src/app.js
const corsOptions = {
  origin: [
    'https://yourdomain.com',
    'https://www.yourdomain.com',
    process.env.CLIENT_URL
  ],
  credentials: true
};
```

### Frontend Configuration

Update your frontend build configuration:

```javascript
// client/vite.config.js
export default defineConfig({
  base: '/',
  build: {
    // ... other config
  }
});
```

---

## Step 5: Verification

### Test DNS Resolution
```bash
# Check A record
dig yourdomain.com +short

# Check CNAME
dig www.yourdomain.com +short

# Check from different locations
nslookup yourdomain.com 8.8.8.8
```

### Test SSL Certificate
```bash
# Check certificate
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com

# Online SSL checker
# Visit: https://www.ssllabs.com/ssltest/
```

### Test Application
```bash
# Run verification script
./verify-tool.sh

# Or manually test
curl -I https://yourdomain.com/api/health
curl https://yourdomain.com/api/ping
```

---

## Step 6: Terraform Integration (Optional)

If using Terraform, add Route53 and ACM resources:

```hcl
# infrastructure/terraform/route53.tf
resource "aws_route53_zone" "main" {
  name = var.domain_name
}

resource "aws_route53_record" "root" {
  zone_id = aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "A"
  
  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "www" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "www.${var.domain_name}"
  type    = "CNAME"
  ttl     = 300
  records = [var.domain_name]
}

# infrastructure/terraform/acm.tf
resource "aws_acm_certificate" "main" {
  provider          = aws.us_east_1  # Required for CloudFront
  domain_name       = var.domain_name
  validation_method = "DNS"

  subject_alternative_names = [
    "www.${var.domain_name}"
  ]

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.main.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = aws_route53_zone.main.zone_id
}

resource "aws_acm_certificate_validation" "main" {
  provider        = aws.us_east_1
  certificate_arn = aws_acm_certificate.main.arn
  validation_record_fqdns = [
    for record in aws_route53_record.cert_validation : record.fqdn
  ]
}
```

---

## Troubleshooting

### DNS Not Propagating
- Wait 24-48 hours for full propagation
- Clear DNS cache: `sudo dscacheutil -flushcache` (macOS)
- Use different DNS servers: `dig @8.8.8.8 yourdomain.com`

### SSL Certificate Issues
- Ensure port 443 is open in security groups
- Check certificate is attached to load balancer/listener
- Verify DNS validation records are correct
- Check certificate expiration: `openssl x509 -in cert.pem -noout -dates`

### CORS Errors
- Verify domain is in CORS allowed origins
- Check HTTPS vs HTTP mismatch
- Ensure credentials are properly configured

### Application Not Accessible
- Verify security groups allow traffic
- Check application is listening on correct port
- Test locally first: `curl http://localhost:3001/api/health`
- Check application logs for errors

---

## Quick Reference Commands

```bash
# Check DNS propagation
dig yourdomain.com +short

# Test SSL certificate
openssl s_client -connect yourdomain.com:443

# Test API endpoint
curl https://yourdomain.com/api/health

# Check Route53 records
aws route53 list-resource-record-sets --hosted-zone-id <ZONE_ID>

# Check ACM certificates
aws acm list-certificates --region us-east-1

# Verify tool locally
./verify-tool.sh
```

---

## Next Steps

After domain setup is complete:

1. ✅ Run `./verify-tool.sh` to verify functionality
2. ✅ Update production environment variables
3. ✅ Configure monitoring and alerts
4. ✅ Set up automated backups
5. ✅ Document your DNS and SSL setup
6. ✅ Test disaster recovery procedures

---

## Support

For issues or questions:
- Check application logs: `server/logs/`
- Review AWS CloudWatch logs
- Verify DNS with: https://dnschecker.org/
- Test SSL with: https://www.ssllabs.com/ssltest/



