// client/src/components/ProtectedRoute.jsx
import { useAuth } from '../context/AuthContext';
export default function ProtectedRoute({ children }) {
  const { user, loading, loginWithHostedUI } = useAuth();
  if (loading) return <div style={{padding:12}}>auth…</div>;
  if (!user) { loginWithHostedUI(); return null; } // go to Hosted UI
  return children;
}
