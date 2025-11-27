# MANGU Configuration - Single Source of Truth

## Port Configuration

**THE SERVER RUNS ON PORT 3001. PERIOD.**

- Server port: `3001` (defined in `server/.env`)
- Frontend port: `5173` (Vite default)
- Vite proxy: `/api` → `http://localhost:3001`

## How to Change the Port (If You Must)

1. Edit `server/.env`:
   ```
   PORT=3001
   ```

2. Update `client/vite.config.js` proxy target:
   ```js
   proxy: {
     '/api': {
       target: 'http://localhost:3001',  // Match PORT in server/.env
   ```

3. That's it. Everything else reads from these two places.

## Starting the Application

```bash
# Option 1: Use start-all.sh (recommended)
./start-all.sh

# Option 2: Use npm (reads from .env automatically)
npm run dev

# Option 3: Manual
cd server && npm run dev  # Reads PORT from .env
cd client && npm run dev  # Proxy reads from vite.config.js
```

## Environment Variables

All server configuration is in `server/.env`. This file is gitignored.
Copy `server/.env.example` to `server/.env` and fill in your values.

**Never hardcode ports in scripts. Always use environment variables.**
