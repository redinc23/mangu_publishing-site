import { useAuth } from '../context/AuthContext';

export default function UserStatus() {
  const { user, loading, logout } = useAuth();
  if (loading) return <span>auth…</span>;
  if (!user) return <span>not signed in</span>;
  return (
    <span>
      signed in as <b>{user.username}</b>{' '}
      <button onClick={logout}>Sign out</button>
    </span>
  );
}
