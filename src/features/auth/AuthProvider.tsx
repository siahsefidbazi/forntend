import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { setAccessToken, setUnauthorizedHandler } from '@/api/session';
import { clearToken, readPhone, readToken, writePhone, writeToken } from './storage';

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

type AuthContextValue = {
  status: AuthStatus;
  /** Phone number of the signed in user, when it is known. */
  phone: string | null;
  /** Persists the access token and moves the app into the authenticated state. */
  signIn: (token: string, phone: string) => Promise<void>;
  /** Removes the persisted session and returns to the anonymous state. */
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [phone, setPhone] = useState<string | null>(null);

  const signIn = useCallback(async (token: string, nextPhone: string) => {
    if (!token?.trim()) throw new Error('توکن معتبر از سرور دریافت نشد.');
    await writeToken(token);
    await writePhone(nextPhone);
    setAccessToken(token);
    setPhone(nextPhone);
    setStatus('authenticated');
  }, []);

  const signOut = useCallback(async () => {
    setAccessToken(null);
    setPhone(null);
    setStatus('anonymous');
    await clearToken();
  }, []);

  useEffect(() => {
    let active = true;

    (async () => {
      const [storedToken, storedPhone] = await Promise.all([
        readToken(),
        readPhone(),
      ]);

      if (!active) {
        return;
      }

      if (storedToken) {
        setAccessToken(storedToken);
        setPhone(storedPhone);
        setStatus('authenticated');
      } else {
        setStatus('anonymous');
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    // A 401 from an authenticated request means the session expired: the backend
    // exposes no refresh token, so the user has to sign in again.
    setUnauthorizedHandler(() => {
      void signOut().catch(() => { /* Memory session is already cleared. */ });
    });

    return () => setUnauthorizedHandler(null);
  }, [signOut]);

  const value = useMemo<AuthContextValue>(
    () => ({ status, phone, signIn, signOut }),
    [status, phone, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider.');
  }

  return context;
}
