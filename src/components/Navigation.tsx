import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function Navigation() {
  const { user, isLoading, signOut } = useAuth();
  const [error, setError] = useState('');
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleLogout = async () => {
    setError('');
    setIsSigningOut(true);
    try {
      await signOut();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not log out. Please try again.');
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <nav>
      <Link to="/">Home</Link>
      {user && (
        <>
          <Link to="/accounts">Accounts</Link>
          <Link to="/budget">Budget</Link>
          <Link to="/cashflow">Cash Flow</Link>
          <Link to="/transactions">Transactions</Link>
          <span>Signed in as {user.username}</span>
          <button disabled={isSigningOut} onClick={handleLogout}>
            {isSigningOut ? 'Logging out…' : 'Log out'}
          </button>
        </>
      )}
      {!isLoading && !user && (
        <>
          <Link to="/signup">Sign Up</Link>
          <Link to="/login">Login</Link>
        </>
      )}
      {error && <p role="alert">{error}</p>}
    </nav>
  );
}
