import { createContext, useContext } from 'react';
import type { AuthUser } from '../api/client';

export type LoginCredentials = { username: string; password: string };
export type SignupDetails = LoginCredentials & { email: string };

export type AuthState = {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  refreshSession: () => Promise<void>;
  signIn: (credentials: LoginCredentials) => Promise<void>;
  signUp: (details: SignupDetails) => Promise<void>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
