// server/src/middleware/authCognito.js
import { jwtVerify, createRemoteJWKSet } from 'jose';

const region = process.env.COGNITO_REGION;
const userPoolId = process.env.COGNITO_USER_POOL_ID;
const appClientId = process.env.COGNITO_APP_CLIENT_ID;

// Issuer for this pool
const issuer = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;

// Remote JWKS (cached by jose, with kid-based lookup)
const JWKS = createRemoteJWKSet(
  new URL(`${issuer}/.well-known/jwks.json`)
);

/**
 * Extracts the Bearer token from Authorization header.
 */
function getBearer(req) {
  const h = req.headers.authorization || req.headers.Authorization;
  if (!h) return null;
  const [scheme, token] = h.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
  return token.trim();
}

/**
 * Verifies a Cognito JWT (ID or Access token) and attaches req.auth.
 * - Checks issuer
 * - Checks algorithm RS256
 * - For ID token: requires token_use === 'id' and aud === app client id
 * - For Access token: requires token_use === 'access' and client_id === app client id
 *
 * If you want to enforce scopes for Access tokens, pass an options object:
 *   authCognito({ requiredScopes: ['your.scope'] })
 */
export function authCognito(options = {}) {
  const { requiredScopes = [] } = options;

  return async function cognitoAuthMiddleware(req, res, next) {
    try {
      const token = getBearer(req);
      if (!token) {
        return res.status(401).json({ error: 'Missing Authorization: Bearer <token>' });
      }

      // Verify signature + issuer + alg (RS256)
      const { payload, protectedHeader } = await jwtVerify(token, JWKS, {
        issuer,
        algorithms: ['RS256'],
      });

      // Basic type checks
      const tokenUse = payload.token_use; // 'id' or 'access'
      if (tokenUse !== 'id' && tokenUse !== 'access') {
        return res.status(401).json({ error: 'Invalid token_use' });
      }

      // Audience / client checks vary by token type
      if (tokenUse === 'id') {
        // ID token should have aud == app client id
        if (payload.aud !== appClientId) {
          return res.status(401).json({ error: 'Invalid ID token audience' });
        }
      } else {
        // Access token should have client_id == app client id
        if (payload.client_id !== appClientId) {
          return res.status(401).json({ error: 'Invalid Access token client_id' });
        }

        // Optional: scope enforcement (space-separated string)
        if (requiredScopes.length > 0) {
          const scopeStr = payload.scope || '';
          const scopes = new Set(scopeStr.split(' ').filter(Boolean));
          const missing = requiredScopes.filter(s => !scopes.has(s));
          if (missing.length) {
            return res.status(403).json({ error: 'Insufficient scope', missing });
          }
        }
      }

      // Attach a normalized auth object to the request
      req.auth = {
        // common
        sub: payload.sub,
        tokenUse,
        username: payload['cognito:username'],
        // id token fields
        aud: payload.aud,
        email: payload.email,
        emailVerified: payload.email_verified,
        // access token fields
        clientId: payload.client_id,
        scope: payload.scope,
        // raw payload/header if you need it
        payload,
        protectedHeader,
      };

      return next();
    } catch (err) {
      // Token expired, bad signature, wrong issuer, etc.
      // You can log err.code or err.message for debugging.
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  };
}
