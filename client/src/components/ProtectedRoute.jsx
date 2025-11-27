// client/src/components/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMockSessionStore } from '../state/useMockSessionStore';

const USE_MOCK_AUTH =
  !import.meta.env.VITE_AWS_REGION || !import.meta.env.VITE_COGNITO_USER_POOL_ID;

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const location = useLocation();
  const { user, loading, loginWithHostedUI, isAdmin } = useAuth();
  const mockUser = useMockSessionStore((state) => state.user);

  if (USE_MOCK_AUTH) {
    if (!mockUser) {
      return <Navigate to="/signin" state={{ from: location }} replace />;
    }

    const isAdminMock = mockUser.isAdmin || mockUser.roles?.includes('admin');
    if (requireAdmin && !isAdminMock) {
      return <Navigate to="/signin" state={{ from: location, reason: 'admin-required' }} replace />;
    }

    return children;
  }

  if (loading) {
    return <div style={{ padding: 12 }}>Authenticating…</div>;
  }

  if (!user) {
    loginWithHostedUI();
    return null;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/signin" state={{ from: location, reason: 'admin-required' }} replace />;
  }

  return children;
}
