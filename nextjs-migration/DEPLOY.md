# Deployment Guide for MANGU Next.js App

## 🚀 Vercel Deployment

### Quick Deploy
1. Push your code to GitHub
2. Import project in Vercel: https://vercel.com/new
3. Vercel auto-detects Next.js and configures everything
4. Add environment variables in Vercel dashboard
5. Deploy!

### Manual Setup
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd mangu
vercel

# Production deploy
vercel --prod
```

### Environment Variables in Vercel
Add these in your Vercel project settings:
- `NEXT_PUBLIC_HERO_VIDEO`
- `NEXT_PUBLIC_LINK_APPLE`
- `NEXT_PUBLIC_LINK_GOOGLE`
- `NEXT_PUBLIC_LINK_AMAZON`
- `NEXT_PUBLIC_INSTAGRAM`
- `NEXT_PUBLIC_YOUTUBE`

## ☁️ AWS Deployment Options

### Option 1: AWS Amplify (Recommended)
1. Connect your GitHub repo to AWS Amplify
2. Amplify auto-detects Next.js
3. Use `aws-amplify.yml` config provided
4. Add environment variables in Amplify console
5. Deploy!

**Benefits:**
- Automatic deployments on git push
- Preview branches
- CDN included
- SSL certificates managed

### Option 2: AWS S3 + CloudFront
```bash
# Build static export (if using SSG)
npm run build
npm run export  # Add to package.json: "export": "next export"

# Upload to S3
aws s3 sync out/ s3://your-bucket-name --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

### Option 3: AWS EC2/ECS with Docker
See `docker-deploy/` folder for containerized deployment.

## 🔧 Deployment Configuration Files

- `vercel.json` - Vercel-specific settings
- `aws-amplify.yml` - AWS Amplify build config
- `.env.production` - Production environment variables (gitignored)

## 📝 Pre-Deployment Checklist

- [ ] Set all environment variables
- [ ] Test production build locally: `npm run build && npm start`
- [ ] Verify API endpoints are configured
- [ ] Check image optimization settings
- [ ] Review security headers in `vercel.json`
- [ ] Test all pages in production mode
- [ ] Set up custom domain (if needed)

## 🔗 Quick Links

- **Vercel Dashboard**: https://vercel.com/dashboard
- **AWS Amplify Console**: https://console.aws.amazon.com/amplify
- **Next.js Deployment Docs**: https://nextjs.org/docs/deployment

