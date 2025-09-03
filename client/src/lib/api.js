// client/src/lib/api.js
import { fetchAuthSession } from 'aws-amplify/auth';
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export async function authedFetch(path, init={}) {
  const s = await fetchAuthSession();
  const at = s.tokens?.accessToken?.toString();
  return fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'Content-Type':'application/json', Authorization:`Bearer ${at}`, ...(init.headers||{}) }
  });
}
