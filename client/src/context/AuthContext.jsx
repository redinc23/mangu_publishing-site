// client/src/context/AuthContext.jsx
import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { Amplify } from 'aws-amplify';
import amplifyConfig from '../amplify-config';

import {
  signIn as amplifySignIn,
  signUp as amplifySignUp,
  confirmSignUp as amplifyConfirmSignUp,
  signOut as amplifySignOut,
  getCurrentUser,
  fetchAuthSession,
  signInWithRedirect,
} from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';

const requiredAmplifyEnvVars = [
  'VITE_AWS_REGION',
  'VITE_COGNITO_USER_POOL_ID',
  'VITE_COGNITO_USER_POOL_CLIENT_ID',
  'VITE_IDENTITY_POOL_ID'
];

const missingAmplifyEnv = requiredAmplifyEnvVars.filter(
  (key) => !import.meta.env[key]
);

if (missingAmplifyEnv.length) {
  console.warn(
    '[amplify] Missing environment variables:',
    missingAmplifyEnv.join(', ')
  );
}

// after imports, before Amplify.configure
// @ts-expect-error - suppress double configuration warning when Amplify typings are strict
if (!window.__AMPLIFY_CONFIGURED__) {
  Amplify.configure(amplifyConfig);
  // @ts-expect-error - flag for subsequent loads in non-typed window
  window.__AMPLIFY_CONFIGURED__ = true;
}

const AuthContext = createContext(null);
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

const ADMIN_ROLE_NAMES = new Set(['admin', 'administrator', 'super-admin']);

const toStringArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((entry) => (typeof entry === 'string' ? entry.trim() : entry))
      .filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  return [];
};

const extractGroupsFromSession = (session) => {
  const roles = new Set();
  const idPayload = session?.tokens?.idToken?.payload;
  const accessPayload = session?.tokens?.accessToken?.payload;

  toStringArray(idPayload?.['cognito:groups']).forEach((role) => roles.add(role));
  toStringArray(idPayload?.groups).forEach((role) => roles.add(role));
  toStringArray(accessPayload?.['cognito:groups']).forEach((role) => roles.add(role));
  toStringArray(accessPayload?.groups).forEach((role) => roles.add(role));

  return Array.from(roles);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // { username, userId, signInDetails, ... }
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState(null);
  const [userGroups, setUserGroups] = useState([]);

  const API_BASE = import.meta.env.VITE_API_URL || '';

  const syncUserWithBackend = useCallback(
    async (token) => {
      if (!API_BASE) return; // skip if not set
      try {
        await fetch(`${API_BASE}/users/sync`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      } catch (err) {
        console.error('Failed to sync user:', err);
      }
    },
    [API_BASE]
  );

  const loadAuthState = useCallback(async () => {
    try {
      const current = await getCurrentUser(); // throws if not signed in
      const session = await fetchAuthSession(); // gets fresh tokens if needed

      const token =
        session?.tokens?.accessToken?.toString?.() ??
        session?.tokens?.idToken?.toString?.() ??
        null;

      setUser(current);
      setAccessToken(token);
      setUserGroups(extractGroupsFromSession(session));

      if (token) await syncUserWithBackend(token);
    } catch {
      setUser(null);
      setAccessToken(null);
      setUserGroups([]);
    } finally {
      setLoading(false);
    }
  }, [syncUserWithBackend]);

  useEffect(() => {
    loadAuthState();
  }, [loadAuthState]);

  // Listen for Hosted UI redirects / sign-in / sign-out events
  useEffect(() => {
    const sub = Hub.listen('auth', ({ payload }) => {
      if (
        payload.event === 'signInWithRedirect' ||
        payload.event === 'signedIn' ||
        payload.event === 'signedOut'
      ) {
        loadAuthState();
      }
    });
    return () => sub();
  }, [loadAuthState]);

  // ---- actions (v6 wrappers) ----

  const signIn = async (email, password) => {
    try {
      const res = await amplifySignIn({ username: email, password });
      await loadAuthState();
      return { success: true, nextStep: res?.nextStep };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: error?.message || 'Sign in failed' };
    }
  };

  const signUp = async (email, password, name) => {
    try {
      const res = await amplifySignUp({
        username: email,
        password,
        options: {
          userAttributes: { email, name }, // include required attributes
        },
      });
      return {
        success: true,
        needsConfirmation: !!res?.nextStep,
        nextStep: res?.nextStep,
      };
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, error: error?.message || 'Sign up failed' };
    }
  };

  const confirmSignUp = async (email, code) => {
    try {
      const res = await amplifyConfirmSignUp({
        username: email,
        confirmationCode: code,
      });
      return { success: true, nextStep: res?.nextStep };
    } catch (error) {
      console.error('Confirm sign up error:', error);
      return { success: false, error: error?.message || 'Confirmation failed' };
    }
  };

  const signOut = async () => {
    try {
      await amplifySignOut(); // pass { global: true } for global sign-out if needed
      setUser(null);
      setAccessToken(null);
      setUserGroups([]);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const getSession = async () => {
    try {
      const session = await fetchAuthSession();
      const at = session?.tokens?.accessToken?.toString?.() || null;
      const it = session?.tokens?.idToken?.toString?.() || null;
      return { session, accessToken: at, idToken: it };
    } catch (error) {
      console.error('Get session error:', error);
      return { session: null, accessToken: null, idToken: null };
    }
  };

  const loginWithHostedUI = () => signInWithRedirect();

  const isAdmin = useMemo(
    () =>
      userGroups.some((role) =>
        ADMIN_ROLE_NAMES.has(String(role).toLowerCase())
      ),
    [userGroups]
  );

  const value = {
    user,
    loading,
    accessToken,
    userGroups,
    isAdmin,
    isAuthenticated: !!user,
    signIn,
    signUp,
    confirmSignUp,
    signOut,
    getSession,
    loginWithHostedUI,
    refresh: loadAuthState,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
