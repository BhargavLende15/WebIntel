import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getCurrentUser,
  login as loginRequest,
  register as registerRequest,
  TOKEN_KEY,
} from '../services/api';

import { AuthContext } from './AuthContextValue';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    window.localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      if (!window.localStorage.getItem(TOKEN_KEY)) {
        if (active) setLoading(false);
        return;
      }

      try {
        const response = await getCurrentUser();
        if (active) setUser(response.data);
      } catch {
        window.localStorage.removeItem(TOKEN_KEY);
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    const handleUnauthorized = () => {
      window.localStorage.removeItem(TOKEN_KEY);
      setUser(null);
    };

    window.addEventListener('webintel:unauthorized', handleUnauthorized);
    restoreSession();

    return () => {
      active = false;
      window.removeEventListener('webintel:unauthorized', handleUnauthorized);
    };
  }, []);

  const signIn = useCallback(async (email, password) => {
    const response = await loginRequest(email, password);
    window.localStorage.setItem(TOKEN_KEY, response.data.access_token);

    try {
      const profile = await getCurrentUser();
      setUser(profile.data);
      return profile.data;
    } catch (error) {
      window.localStorage.removeItem(TOKEN_KEY);
      throw error;
    }
  }, []);

  const signUp = useCallback(async (payload) => {
    await registerRequest(payload);
    return signIn(payload.email, payload.password);
  }, [signIn]);

  const value = useMemo(
    () => ({ user, loading, signIn, signUp, logout }),
    [user, loading, signIn, signUp, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}


export function ProtectedRoute({ children }) {
  const { user, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate('/login', { replace: true });
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <p className="text-sm text-slate-500">Restoring your WebIntel session…</p>
      </main>
    );
  }

  return user ? children : null;
}
