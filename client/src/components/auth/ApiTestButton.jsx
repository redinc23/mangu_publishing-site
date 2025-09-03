// client/src/components/auth/ApiTestButton.jsx
import { fetchAuthSession } from 'aws-amplify/auth';
export default function ApiTestButton() {
  return <button onClick={async ()=> {
    const s = await fetchAuthSession();
    const at = s.tokens?.accessToken?.toString();
    const r = await fetch('http://localhost:5000/api/me', {
      headers: { Authorization: `Bearer ${at}` }
    });
    alert(JSON.stringify(await r.json(), null, 2));
  }}>Test /api/me</button>;
}
