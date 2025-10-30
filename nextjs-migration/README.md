# MANGU Next.js Migration

Complete Next.js implementation with all pages, components, and deployment configs.

## Quick Start

The full bootstrap script is provided. Due to the length of page files, we recommend:

### Option 1: Use Provided Bootstrap (Recommended)
Run the complete bash script provided by the user - it contains all page implementations.

### Option 2: Manual Step-by-Step
1. Create Next.js app: `npm create next-app@latest mangu -- --typescript --app --eslint --tailwind=false`
2. Install Tailwind: `npm i -D tailwindcss postcss autoprefixer && npx tailwindcss init -p`
3. Add pages from the templates provided
4. Run: `npm run dev`

## 📁 Structure

```
mangu/
├── app/
│   ├── layout.tsx          # Root layout with dark theme
│   ├── page.tsx             # Homepage (v4 design)
│   ├── globals.css          # Tailwind setup
│   ├── library/
│   │   ├── page.tsx         # Library list
│   │   └── [slug]/
│   │       └── page.tsx     # Book detail
│   ├── signin/page.tsx      # Sign in with book background
│   ├── profile/page.tsx      # User profile
│   ├── admin/page.tsx       # Admin dashboard
│   ├── about/page.tsx       # About page
│   └── [audiobooks|video|new]/page.tsx  # Stub pages
├── components/
│   ├── Nav.tsx              # Navigation header
│   └── Buttons.tsx          # Button components
├── vercel.json              # Vercel deployment config
├── aws-amplify.yml          # AWS Amplify config
└── .env.local               # Environment variables
```

## 🚀 Deployment

See `DEPLOY.md` for complete deployment instructions for:
- **Vercel** (Recommended for Next.js)
- **AWS Amplify** (Full AWS integration)
- **AWS S3 + CloudFront** (Static hosting)

## 📝 Pages Implemented

✅ Homepage - Hero video, featured book, trending
✅ Library - Grid of books with covers
✅ Library Detail - Book info, formats, author card
✅ Sign In - Animated book background
✅ Profile - User stats and preferences
✅ Admin - Content management dashboard
✅ About - Company info and featured authors
✅ Stub pages - Audiobooks, Video, New

## 🎨 Features

- Dark theme (#141414 background)
- Fully responsive design
- Tailwind CSS styling
- TypeScript support
- Ready for API integration
- Deployment configs included

## ⚙️ Environment Variables

Set these in `.env.local`:
```
NEXT_PUBLIC_HERO_VIDEO=
NEXT_PUBLIC_LINK_APPLE=
NEXT_PUBLIC_LINK_GOOGLE=
NEXT_PUBLIC_LINK_AMAZON=
NEXT_PUBLIC_INSTAGRAM=
NEXT_PUBLIC_YOUTUBE=
```

