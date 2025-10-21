#!/usr/bin/env bash
set -euo pipefail

echo "==> creating safe scaffolding (skips existing files)..."

# ---- env defaults (REPLACE WITH YOUR VALUES) ----
REGION="us-east-1"
POOL_ID="us-east-1_XXXXXXXXX"
APP_CLIENT_ID="your-app-client-id-here"
DOMAIN="your-domain.auth.us-east-1.amazoncognito.com"
REDIRECT="http://localhost:5173"
API_BASE="http://localhost:5000/api"

mkdir -p client/src/components client/src/components/auth client/src/lib client/src/config server/src/middleware server/src/payments server/src/utils seed server/test

# ---------- CLIENT ----------

# client/.env (create if missing)
if [ ! -f client/.env ]; then
  cat > client/.env <<ENV
VITE_AWS_REGION=$REGION
VITE_COGNITO_USER_POOL_ID=$POOL_ID
VITE_COGNITO_CLIENT_ID=$APP_CLIENT_ID
VITE_COGNITO_DOMAIN=$DOMAIN
VITE_REDIRECT_SIGN_IN=$REDIRECT
VITE_REDIRECT_SIGN_OUT=$REDIRECT
VITE_API_URL=$API_BASE
ENV
  echo "created client/.env"
else
  echo "skip client/.env (exists)"
fi

# vite.config.js (only create if missing)
if [ ! -f client/vite.config.js ]; then
  cat > client/vite.config.js <<'VC'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  }
})
VC
  echo "created client/vite.config.js"
else
  echo "skip client/vite.config.js (exists)"
fi

# ProtectedRoute.jsx
if [ ! -f client/src/components/ProtectedRoute.jsx ]; then
  cat > client/src/components/ProtectedRoute.jsx <<'PR'
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading, loginWithHostedUI } = useAuth();
  if (loading) return <div style={{padding:12}}>auth…</div>;
  if (!user) { loginWithHostedUI(); return null; }
  return children;
}
PR
  echo "created client/src/components/ProtectedRoute.jsx"
else
  echo "skip ProtectedRoute.jsx (exists)"
fi

# UserStatus.jsx
if [ ! -f client/src/components/UserStatus.jsx ]; then
  cat > client/src/components/UserStatus.jsx <<'US'
import { useAuth } from '../context/AuthContext';

export default function UserStatus() {
  const { user, loading, signOut } = useAuth();
  if (loading) return <span>auth…</span>;
  if (!user) return <span>not signed in</span>;
  return (
    <span>
      signed in as <b>{user.username}</b>{' '}
      <button onClick={signOut}>Sign out</button>
    </span>
  );
}
US
  echo "created client/src/components/UserStatus.jsx"
else
  echo "skip UserStatus.jsx (exists)"
fi

# ApiTestButton.jsx (handy tester)
if [ ! -f client/src/components/auth/ApiTestButton.jsx ]; then
  cat > client/src/components/auth/ApiTestButton.jsx <<'ATB'
import { fetchAuthSession } from 'aws-amplify/auth';

export default function ApiTestButton() {
  return <button onClick={async ()=>{
    const s = await fetchAuthSession();
    const at = s.tokens?.accessToken?.toString();
    const r = await fetch(import.meta.env.VITE_API_URL + '/me', {
      headers: { Authorization: `Bearer ${at}` }
    });
    const j = await r.json();
    alert(JSON.stringify(j, null, 2));
  }}>Test /api/me</button>;
}
ATB
  echo "created client/src/components/auth/ApiTestButton.jsx"
else
  echo "skip ApiTestButton.jsx (exists)"
fi

# authedFetch helper
if [ ! -f client/src/lib/api.js ]; then
  cat > client/src/lib/api.js <<'API'
import { fetchAuthSession } from 'aws-amplify/auth';
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'\;

export async function authedFetch(path, init={}) {
  const s = await fetchAuthSession();
  const at = s.tokens?.accessToken?.toString();
  return fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${at}`,
      ...(init.headers || {}),
    },
  });
}
API
  echo "created client/src/lib/api.js"
else
  echo "skip client/src/lib/api.js (exists)"
fi

# ---------- SERVER ----------

# authCognito middleware (create if missing)
if [ ! -f server/src/middleware/authCognito.js ]; then
  cat > server/src/middleware/authCognito.js <<'AC'
import { createRemoteJWKSet, jwtVerify } from 'jose';

const { COGNITO_REGION, COGNITO_USER_POOL_ID, COGNITO_APP_CLIENT_ID } = process.env;
if (!COGNITO_REGION || !COGNITO_USER_POOL_ID || !COGNITO_APP_CLIENT_ID) {
  console.warn('[authCognito] missing envs: COGNITO_REGION/USER_POOL_ID/APP_CLIENT_ID');
}
const issuer = `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}`;
const JWKS = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`));

export function authCognito() {
  return async (req, res, next) => {
    try {
      const hdr = req.headers.authorization || '';
      const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
      if (!token) return res.status(401).json({ error: 'Missing bearer token' });

      const { payload } = await jwtVerify(token, JWKS, { issuer });

      // Accept id or access tokens; enforce client
      if (payload.token_use === 'id') {
        if (payload.aud !== COGNITO_APP_CLIENT_ID) {
          return res.status(401).json({ error: 'Invalid audience' });
        }
      } else if (payload.token_use === 'access') {
        if (payload.client_id !== COGNITO_APP_CLIENT_ID) {
          return res.status(401).json({ error: 'Invalid client_id' });
        }
      } else {
        return res.status(401).json({ error: 'Invalid token_use' });
      }

      req.auth = payload;
      next();
    } catch (err) {
      console.error('[authCognito] verify failed:', err?.message);
      return res.status(401).json({ error: 'Unauthorized' });
    }
  };
}
AC
  echo "created server/src/middleware/authCognito.js"
else
  echo "skip authCognito.js (exists)"
fi

# stripe routes stub (create if missing)
if [ ! -f server/src/payments/stripe.routes.js ]; then
  cat > server/src/payments/stripe.routes.js <<'SR'
import express from 'express';
import Stripe from 'stripe';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2024-06-20' });

// Create Checkout Session (simple, expects array of items with {name, amount, quantity})
router.post('/create-checkout-session', async (req, res) => {
  try {
    const { items = [] } = req.body || {};
    const line_items = items.map(i => ({
      price_data: {
        currency: 'usd',
        product_data: { name: i.name || 'Item' },
        unit_amount: Number(i.amount || 0), // cents
      },
      quantity: Number(i.quantity || 1),
    }));
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      success_url: (process.env.FRONTEND_URL || 'http://localhost:5173') + '/?success=1',
      cancel_url: (process.env.FRONTEND_URL || 'http://localhost:5173') + '/?canceled=1',
    });
    res.json({ url: session.url });
  } catch (e) {
    console.error('stripe session error:', e);
    res.status(500).json({ error: e.message });
  }
});

export default router;
SR
  echo "created server/src/payments/stripe.routes.js"
else
  echo "skip stripe.routes.js (exists)"
fi

# server/.env (create if missing)
if [ ! -f server/.env ]; then
  cat > server/.env <<ENV
NODE_ENV=development
PORT=5000
COGNITO_REGION=$REGION
COGNITO_USER_POOL_ID=$POOL_ID
COGNITO_APP_CLIENT_ID=$APP_CLIENT_ID
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
FRONTEND_URL=$REDIRECT
DDB_TABLE_BOOKS=
DDB_TABLE_USERS=
S3_BUCKET_MEDIA=
ENV
  echo "created server/.env"
else
  echo "skip server/.env (exists)"
fi

echo "==> done."
echo
echo "NEXT:"
echo "1) Install deps if needed:"
echo "   yarn --cwd server add jose stripe"
echo "   # client already has aws-amplify@v6; if not: yarn --cwd client add aws-amplify"
echo "2) If not already mounted, in server/src/index.js add:"
echo "   import paymentsRouter from './payments/stripe.routes.js';"
echo "   app.use('/api/payments', paymentsRouter);"
echo "3) Run:  yarn --cwd server start   |   yarn --cwd client dev"
echo "4) In the app, import and place <ApiTestButton/> somewhere to test /api/me"
