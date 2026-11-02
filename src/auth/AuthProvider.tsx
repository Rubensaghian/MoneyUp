import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { getCurrentUser, onSessionExpired, postJson } from '../api/client';
import type { AuthUser } from '../api/client';
import { AuthContext } from './AuthContext';
import type { LoginCredentials, SignupDetails } from './AuthContext';

type Session = {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
};

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session>({ user: null, isLoading: true, error: null });
  const sessionVersion = useRef(0);

  const clearSession = useCallback(() => {
    sessionVersion.current += 1;
    setSession({ user: null, isLoading: false, error: null });
  }, []);

  const refreshSession = useCallback(async (signal?: AbortSignal) => {
    const version = ++sessionVersion.current;
    setSession(previous => ({ ...previous, isLoading: true, error: null }));
    try {
      const user = await getCurrentUser(signal);
      if (!signal?.aborted && version === sessionVersion.current) {
        setSession({ user, isLoading: false, error: null });
      }
    } catch (error) {
      if (!signal?.aborted && version === sessionVersion.current) {
        setSession({
          user: null,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Could not check your session. Please try again.',
        });
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void refreshSession(controller.signal);
    return () => controller.abort();
  }, [refreshSession]);

  useEffect(() => onSessionExpired(clearSession), [clearSession]);

  const authenticate = async (url: string, details: LoginCredentials | SignupDetails) => {
    const user = await postJson<AuthUser>(url, details);
    // An older startup check must not overwrite a newly authenticated session.
    sessionVersion.current += 1;
    setSession({ user, isLoading: false, error: null });
  };

  const signIn = (credentials: LoginCredentials) => authenticate('/api/auth/login', credentials);
  const signUp = (details: SignupDetails) => authenticate('/api/auth/signup', details);

  const signOut = async () => {
    await postJson<void>('/api/auth/logout');
    clearSession();
  };

  return (
    <AuthContext.Provider value={{ ...session, refreshSession, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
