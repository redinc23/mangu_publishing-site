#!/usr/bin/env bash

set -euo pipefail

APP_NAME="mangu"

echo "🚀 Creating MANGU Next.js Project..."

# 1) Create Next.js app
npm create next-app@latest "$APP_NAME" -- --typescript --app --eslint --src-dir=false --import-alias "@/*" --tailwind=false --yes

cd "$APP_NAME"

# 2) Tailwind setup
echo "🎨 Installing Tailwind..."
npm i -D tailwindcss postcss autoprefixer
npx tailwindcss init -p --yes

cat > tailwind.config.js << 'TAILWIND_EOF'
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}','./components/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
};
TAILWIND_EOF

mkdir -p app components

cat > app/globals.css << 'CSS_EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;
CSS_EOF

# 3) Env placeholders
cat > .env.local << 'ENV_EOF'
NEXT_PUBLIC_HERO_VIDEO=
NEXT_PUBLIC_LINK_APPLE=
NEXT_PUBLIC_LINK_GOOGLE=
NEXT_PUBLIC_LINK_AMAZON=
NEXT_PUBLIC_INSTAGRAM=
NEXT_PUBLIC_YOUTUBE=
ENV_EOF

# Continue with rest of implementation...
echo "✅ Base setup complete. Pages creation continues..."
echo "📝 Note: Full page files will be created in separate step for better organization."

