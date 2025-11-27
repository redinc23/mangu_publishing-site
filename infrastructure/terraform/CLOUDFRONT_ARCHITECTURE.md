# CloudFront Architecture Diagram

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          End Users                                   │
│                    (Desktop, Mobile, Tablet)                         │
└────────────────────┬────────────────────────────────────────────────┘
                     │
                     │ HTTPS (TLS 1.2+)
                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     Route 53 DNS                                     │
│                 domain.com → CloudFront                              │
└────────────────────┬────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     AWS WAF Web ACL                                  │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ Rules:                                                      │   │
│  │ • AWS Common Rule Set (OWASP Core)                        │   │
│  │ • Known Bad Inputs                                         │   │
│  │ • SQL Injection Protection                                 │   │
│  │ • Linux OS Protection                                      │   │
│  │ • Rate Limiting (2000 req/5min)                          │   │
│  │ • Geo-blocking (optional)                                 │   │
│  └────────────────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────────────────┘
                     │ Allow
                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│              CloudFront Distribution                                 │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ CloudFront Functions (Edge):                                  │  │
│  │ • URL Rewrite (SPA routing)                                  │  │
│  │ • Security headers injection                                  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Cache Behaviors (Priority Order):                            │  │
│  │                                                               │  │
│  │ 1. /api/*      → ALB Origin (No Cache)                      │  │
│  │ 2. /assets/*   → S3 Static (1 year TTL)                     │  │
│  │ 3. /static/*   → S3 Uploads (1 hour TTL)                    │  │
│  │ 4. /uploads/*  → S3 Uploads (1 hour TTL)                    │  │
│  │ 5. /*          → S3 Static (1 day TTL) [Default]            │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Response Headers Policy:                                      │  │
│  │ • HSTS, CSP, X-Frame-Options, X-XSS-Protection              │  │
│  │ • CORS headers                                               │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────┬────────────┬─────────────┬──────────────────────────────┘
             │            │             │
             │            │             │
   ┌─────────▼────┐  ┌───▼─────┐  ┌───▼─────────┐
   │ Origin       │  │ Origin  │  │ Origin      │
   │ Shield       │  │ Shield  │  │ Shield      │
   │ (Optional)   │  │(Optional)  │(Optional)   │
   └─────────┬────┘  └───┬─────┘  └───┬─────────┘
             │            │             │
             │            │             │
   ┌─────────▼────────────▼─────────────▼─────────────────────┐
   │                   Origins                                 │
   │                                                           │
   │  ┌──────────────────┐  ┌────────────────┐  ┌──────────┐│
   │  │  S3 Bucket       │  │  S3 Bucket     │  │   ALB    ││
   │  │  (Static Assets) │  │  (Uploads)     │  │          ││
   │  │                  │  │                │  │          ││
   │  │ • CSS/JS/Fonts   │  │ • Book Covers  │  │ • API    ││
   │  │ • Built assets   │  │ • Author Photos│  │ • SSR    ││
   │  │ • index.html     │  │ • User content │  │ • Dynamic││
   │  │ • error.html     │  │                │  │          ││
   │  └──────────────────┘  └────────────────┘  └────┬─────┘│
   │                                                  │      │
   │  OAC Protected         OAC Protected            │      │
   │  (Origin verification header required)          │      │
   └─────────────────────────────────────────────────┼──────┘
                                                     │
                                           ┌─────────▼─────────┐
                                           │   ECS Fargate     │
                                           │   (Backend API)   │
                                           └───────────────────┘
```

## Request Flow Diagrams

### Static Asset Request (Cache Hit)

```
User
  │
  │ GET /assets/app.abc123.js
  ▼
DNS (Route 53)
  │
  ▼
WAF
  │ ✓ Allowed
  ▼
CloudFront Edge
  │
  │ Check cache
  │ ✓ CACHE HIT
  │
  │ Add security headers
  ▼
User (50-150ms TTFB)
```

### Static Asset Request (Cache Miss)

```
User
  │
  │ GET /assets/new-file.xyz789.js
  ▼
DNS (Route 53)
  │
  ▼
WAF
  │ ✓ Allowed
  ▼
CloudFront Edge
  │
  │ Check cache
  │ ✗ CACHE MISS
  │
  ▼
Origin Shield (Optional)
  │
  │ Check cache
  │ ✗ CACHE MISS
  │
  ▼
S3 Bucket (Static Assets)
  │
  │ Verify OAC signature
  │ ✓ Valid
  │
  │ Return file
  ▼
CloudFront Edge
  │
  │ Store in cache (TTL: 1 year)
  │ Add security headers
  ▼
User (200-400ms TTFB - first request only)
```

### API Request (No Cache)

```
User
  │
  │ POST /api/books
  │ Headers: Cookie, Authorization
  ▼
DNS (Route 53)
  │
  ▼
WAF
  │ ✓ Allowed (not rate limited)
  ▼
CloudFront Edge
  │
  │ /api/* path → No cache
  │ Forward ALL headers/cookies
  │
  ▼
ALB
  │
  │ Verify origin header
  │ ✓ Valid
  │
  ▼
ECS Fargate (Backend)
  │
  │ Process API request
  │ Query database
  │
  ▼
User (with response)
```

### Error Page (404/403)

```
User
  │
  │ GET /page-not-found
  ▼
CloudFront
  │
  │ Origin returns 404
  │
  │ Custom error response:
  │ 404 → 200 (index.html)
  │
  ▼
CloudFront Function
  │
  │ URL rewrite for SPA
  │ Add security headers
  │
  ▼
User (sees SPA, client-side routing)
```

### WAF Block

```
User (Malicious)
  │
  │ GET /?id=1' OR '1'='1
  │ (SQL Injection attempt)
  ▼
WAF
  │
  │ Check SQL Injection Rule
  │ ✗ BLOCKED
  │
  │ Return 403 Forbidden
  │ Log to CloudWatch
  │ Increment metrics
  │
  ▼
User (403 Forbidden)

CloudWatch Alarm
  │
  │ Check BlockedRequests metric
  │ > 1000 in 5min?
  │
  ▼
SNS Notification
  │
  ▼
DevOps Team Alert
```

## Cache Invalidation Flow

### Manual Invalidation

```
DevOps Engineer
  │
  │ ./scripts/invalidate-cache.sh "/static/*"
  ▼
AWS CLI
  │
  │ create-invalidation
  ▼
CloudFront
  │
  │ Invalidate matching paths
  │ Across all edge locations
  │ (Takes 1-5 minutes)
  │
  ▼
Edge Locations
  │
  │ Remove cached objects
  │ Next request = cache miss
  │
  ▼
Fresh content served
```

### Automated Invalidation (SNS Trigger)

```
CI/CD Pipeline
  │
  │ Deploy new assets
  │
  ▼
SNS Topic
  │
  │ Message: {"paths":["/static/*"],"type":"selective"}
  ▼
Lambda Function
  │
  │ Parse message
  │ Call CloudFront API
  │
  ▼
CloudFront
  │
  │ create-invalidation
  │ Invalidate paths
  │
  ▼
Edge Locations
  │
  │ Remove cached objects
  │
  ▼
CloudWatch Logs
  │
  │ Log invalidation ID
  │ Log status
  │
  ▼
Done (automated)
```

## Component Interaction Matrix

```
┌──────────────┬──────┬─────┬────────┬──────────┬──────────┐
│ Component    │ WAF  │ CF  │ S3     │ ALB      │ Lambda   │
├──────────────┼──────┼─────┼────────┼──────────┼──────────┤
│ WAF          │  -   │ →   │   -    │    -     │    -     │
│ CloudFront   │  ←   │  -  │  ↔     │   ↔      │    -     │
│ S3 Static    │  -   │  ←  │   -    │    -     │    -     │
│ S3 Uploads   │  -   │  ←  │   -    │    -     │    -     │
│ ALB          │  -   │  ←  │   -    │    -     │    -     │
│ Lambda       │  -   │  →  │   -    │    -     │    -     │
│ SNS          │  -   │  -  │   -    │    -     │   →      │
│ CloudWatch   │  ←   │  ←  │   ←    │   ←      │   ←      │
└──────────────┴──────┴─────┴────────┴──────────┴──────────┘

Legend:
→  Sends requests to
←  Receives requests from
↔  Bidirectional communication
-  No direct interaction
```

## Security Layers

```
┌─────────────────────────────────────────────────────────┐
│ Layer 7: Application (CloudFront Function)              │
│ • URL rewriting                                          │
│ • Request validation                                     │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│ Layer 6: WAF (AWS WAF)                                   │
│ • OWASP Top 10 protection                               │
│ • Rate limiting                                          │
│ • Geo-blocking                                           │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│ Layer 5: CDN (CloudFront)                                │
│ • DDoS protection (AWS Shield Standard)                 │
│ • Security headers                                       │
│ • TLS 1.2+ enforcement                                  │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│ Layer 4: Origin Access (OAC + Custom Header)            │
│ • S3: OAC signature required                            │
│ • ALB: Custom verification header                       │
│ • No direct public access                               │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│ Layer 3: Origin (S3/ALB)                                 │
│ • S3: Bucket policies                                    │
│ • ALB: Security groups                                   │
│ • Private subnets                                        │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│ Layer 2: Backend (ECS/RDS)                               │
│ • Application-level auth                                 │
│ • Database encryption                                    │
│ • Secrets Manager                                        │
└─────────────────────────────────────────────────────────┘
```

## Monitoring & Observability

```
┌─────────────────────────────────────────────────────────┐
│                   CloudWatch                             │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Metrics                                            │ │
│  │ • CacheHitRate                                     │ │
│  │ • BytesDownloaded                                  │ │
│  │ • Requests                                         │ │
│  │ • 4xxErrorRate                                     │ │
│  │ • 5xxErrorRate                                     │ │
│  │ • OriginLatency                                    │ │
│  └───────────────────────────────────────────────────┘ │
│                                                          │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Alarms                                             │ │
│  │ • WAF Blocked Requests > 1000                     │ │
│  │ • 4xx Error Rate > 5%                             │ │
│  │ • 5xx Error Rate > 1%                             │ │
│  └───────────┬───────────────────────────────────────┘ │
└──────────────┼──────────────────────────────────────────┘
               │
               ▼
         ┌─────────────┐
         │     SNS     │
         │  (Alerts)   │
         └─────┬───────┘
               │
       ┌───────┼───────┐
       │               │
       ▼               ▼
  ┌────────┐    ┌──────────┐
  │ Email  │    │ PagerDuty│
  └────────┘    └──────────┘
```

## Data Flow (Read Path)

```
1. User Request
   ↓
2. DNS Resolution (Route 53)
   ↓
3. WAF Rules Processing (5-10ms)
   ↓
4. CloudFront Edge Location (cache check)
   ├─→ Cache Hit (50-150ms total)
   │   └─→ Return cached content
   │
   └─→ Cache Miss
       ↓
5. Origin Shield (optional, cache check)
   ├─→ Cache Hit (100-200ms total)
   │   └─→ Return cached content
   │
   └─→ Cache Miss
       ↓
6. Origin Request
   ├─→ S3 (static/uploads)
   │   └─→ Retrieve file (50-100ms)
   │
   └─→ ALB → ECS
       └─→ Process request (100-500ms)
       └─→ Database query (if needed)
   ↓
7. Response to CloudFront
   ↓
8. Cache at Edge (if cacheable)
   ↓
9. Add Security Headers
   ↓
10. Return to User
```

## Cost Breakdown by Component

```
┌─────────────────────────────────────────────────────────┐
│ CloudFront Distribution                                  │
│ • Requests: $0.0075/10k (first 10B)          ~$10/mo   │
│ • Data Transfer: $0.085/GB (first 10TB)      ~$85/mo   │
├─────────────────────────────────────────────────────────┤
│ AWS WAF                                                  │
│ • Web ACL: $5/month                           $5/mo     │
│ • Managed Rules: $1/rule/month (4 rules)     $4/mo     │
│ • Request Processing: Free (first 1M)        $0/mo     │
├─────────────────────────────────────────────────────────┤
│ Origin Shield (Optional)                                 │
│ • Per region: ~$10/month                     $10/mo     │
├─────────────────────────────────────────────────────────┤
│ Lambda (Cache Invalidation)                              │
│ • Invocations: $0.20/1M                      <$1/mo     │
├─────────────────────────────────────────────────────────┤
│ S3 (Logs)                                                │
│ • Storage: $0.023/GB                         ~$1/mo     │
│ • Requests: Minimal                          <$1/mo     │
├─────────────────────────────────────────────────────────┤
│ CloudWatch                                               │
│ • Metrics: Free (standard)                   $0/mo      │
│ • Alarms: $0.10/alarm (3 alarms)            $0.30/mo   │
│ • Logs: $0.50/GB                             ~$2/mo     │
├─────────────────────────────────────────────────────────┤
│ TOTAL (without Origin Shield)                ~$108/mo   │
│ TOTAL (with Origin Shield)                   ~$118/mo   │
└─────────────────────────────────────────────────────────┘

* Based on 10M requests/month, 1TB data transfer
* Actual costs vary with traffic
```

## Scalability & High Availability

```
┌─────────────────────────────────────────────────────────┐
│ Global Edge Network                                      │
│                                                          │
│  North America    Europe        Asia Pacific             │
│  ┌──────────┐    ┌──────────┐  ┌──────────┐            │
│  │ Edge POP │    │ Edge POP │  │ Edge POP │            │
│  │ (50+)    │    │ (30+)    │  │ (40+)    │            │
│  └────┬─────┘    └────┬─────┘  └────┬─────┘            │
│       │               │             │                   │
│       └───────────────┼─────────────┘                   │
│                       │                                  │
│              ┌────────▼────────┐                        │
│              │ Origin Shield   │                        │
│              │ (us-east-1)     │                        │
│              └────────┬────────┘                        │
│                       │                                  │
│              ┌────────▼────────┐                        │
│              │   Multi-AZ      │                        │
│              │   Origins       │                        │
│              │                 │                        │
│              │ • S3 (99.99%)   │                        │
│              │ • ALB Multi-AZ  │                        │
│              │ • ECS Fargate   │                        │
│              └─────────────────┘                        │
│                                                          │
│ Performance:                                             │
│ • 200+ Edge Locations globally                          │
│ • <50ms latency to 90% of users                        │
│ • 85-95% cache hit ratio                                │
│ • Auto-scaling based on demand                          │
│                                                          │
│ Availability:                                            │
│ • 99.99% SLA (CloudFront)                               │
│ • Automatic failover between origins                    │
│ • DDoS protection (AWS Shield Standard)                 │
│ • Geographic redundancy                                  │
└─────────────────────────────────────────────────────────┘
```

## Legend & Conventions

```
Symbols:
  →   Data flow / Request direction
  ↔   Bidirectional communication
  ▼   Process flow
  ✓   Success / Allowed
  ✗   Failure / Blocked
  ┌─┐ Container / Component
  │ │ Vertical connection
  ─── Horizontal connection

Components:
  POP   Point of Presence (Edge Location)
  OAC   Origin Access Control
  CF    CloudFront
  ALB   Application Load Balancer
  ECS   Elastic Container Service
  SNS   Simple Notification Service
```

---

**Architecture Version:** 1.0.0  
**Last Updated:** 2024-11-11  
**Status:** Production Ready
