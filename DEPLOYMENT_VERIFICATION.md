# Deployment Verification Checklist

Quick reference guide for verifying your tool and setting up domain integration.

## 🚀 Quick Start

### 1. Verify Tool Functionality Locally

```bash
# Make sure your server is running
cd server
npm start

# In another terminal, run verification
cd ..
./verify-tool.sh
```

The verification script will test:
- ✅ Server connectivity
- ✅ Health endpoints (`/api/health`, `/api/ping`)
- ✅ Readiness and liveness probes
- ✅ Metrics endpoint
- ✅ Books API endpoint
- ✅ Database connectivity
- ✅ Redis connectivity (if enabled)

### 2. Set Up Domain Integration

**Option A: Automated Setup (AWS)**
```bash
./scripts/setup-domain.sh
# Select option 1 for Route53 DNS
# Select option 2 for ACM SSL certificate
```

**Option B: Manual Setup**
Follow the detailed guide: [DOMAIN_SETUP_GUIDE.md](./DOMAIN_SETUP_GUIDE.md)

### 3. Verify Production Deployment

```bash
# Test your production domain
export BASE_URL=https://yourdomain.com
./verify-tool.sh
```

---

## 📋 Pre-Deployment Checklist

- [ ] Local verification passes (`./verify-tool.sh`)
- [ ] Database migrations completed
- [ ] Environment variables configured
- [ ] Security groups/firewall rules configured
- [ ] SSL certificate obtained and configured
- [ ] DNS records added and propagated
- [ ] CORS settings updated for production domain
- [ ] Monitoring and logging configured
- [ ] Backup strategy in place

---

## 🔍 Verification Endpoints

Your application exposes these health check endpoints:

| Endpoint | Purpose | Expected Response |
|----------|---------|-------------------|
| `/api/ping` | Simple connectivity check | `pong` |
| `/api/health` | Comprehensive health check | JSON with status, database, redis, memory |
| `/api/health/ready` | Readiness probe (K8s/ECS) | `{"ready": true}` |
| `/api/health/live` | Liveness probe (K8s/ECS) | `{"alive": true}` |
| `/api/health/metrics` | System metrics | JSON with memory, CPU, database stats |

---

## 🌐 Domain Setup Quick Reference

### DNS Records Needed

**Root Domain (A Record):**
- Type: `A`
- Name: `@` or blank
- Value: Your server IP or ALB DNS name
- TTL: `300`

**WWW Subdomain (CNAME):**
- Type: `CNAME`
- Name: `www`
- Value: `yourdomain.com`
- TTL: `300`

### SSL Certificate Options

1. **AWS ACM** (Recommended for AWS)
   - Free, auto-renewing
   - Integrated with ALB/CloudFront
   - Use `setup-domain.sh` option 2

2. **Let's Encrypt** (For standalone servers)
   - Free, 90-day validity
   - Auto-renewal with certbot
   - Use `setup-domain.sh` option 4

3. **Cloudflare** (If using Cloudflare DNS)
   - Automatic SSL
   - Set SSL mode to "Full"

---

## 🛠️ Troubleshooting

### Server Not Responding
```bash
# Check if server is running
curl http://localhost:3001/api/ping

# Check server logs
tail -f server/logs/*.log

# Check process
ps aux | grep node
```

### DNS Not Resolving
```bash
# Check DNS propagation
dig yourdomain.com +short
dig @8.8.8.8 yourdomain.com

# Check from different locations
# Visit: https://dnschecker.org/
```

### SSL Certificate Issues
```bash
# Test SSL connection
openssl s_client -connect yourdomain.com:443

# Check certificate details
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com | openssl x509 -noout -dates

# Online SSL checker
# Visit: https://www.ssllabs.com/ssltest/
```

### CORS Errors
- Verify domain is in CORS allowed origins
- Check HTTPS vs HTTP mismatch
- Ensure credentials are properly configured

---

## 📚 Documentation

- **Full Domain Setup Guide**: [DOMAIN_SETUP_GUIDE.md](./DOMAIN_SETUP_GUIDE.md)
- **Infrastructure Docs**: [docs/INFRASTRUCTURE.md](./docs/INFRASTRUCTURE.md)
- **Deployment Guide**: [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)

---

## ✅ Post-Deployment Verification

After domain setup, verify:

1. **DNS Resolution**
   ```bash
   dig yourdomain.com +short
   dig www.yourdomain.com +short
   ```

2. **SSL Certificate**
   ```bash
   curl -I https://yourdomain.com
   # Should return 200 or 301/302
   ```

3. **API Endpoints**
   ```bash
   curl https://yourdomain.com/api/ping
   curl https://yourdomain.com/api/health
   ```

4. **Full Verification**
   ```bash
   BASE_URL=https://yourdomain.com ./verify-tool.sh
   ```

---

## 🎯 Next Steps

After successful verification:

1. Set up monitoring and alerts
2. Configure automated backups
3. Set up CI/CD pipeline
4. Document your deployment process
5. Plan disaster recovery procedures

---

## 💡 Tips

- **DNS Propagation**: Can take 24-48 hours globally
- **SSL Validation**: ACM DNS validation usually completes in 5-30 minutes
- **Testing**: Use `./verify-tool.sh` before and after domain setup
- **Monitoring**: Set up CloudWatch/health check alerts
- **Backups**: Automate database backups before production deployment

---

For detailed instructions, see [DOMAIN_SETUP_GUIDE.md](./DOMAIN_SETUP_GUIDE.md)



