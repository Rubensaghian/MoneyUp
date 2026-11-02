import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function RequireAuth() {
  const { user, isLoading, error, refreshSession } = useAuth();
  const location = useLocation();

  if (isLoading) return <p role="status">Checking your session…</p>;

  if (error) {
    return (
      <Alert severity="error" action={<Button onClick={() => void refreshSession()}>Retry</Button>}>
        {error}
      </Alert>
    );
  }

  if (!user) {
    const from = location.pathname + location.search + location.hash;
    return <Navigate to="/login" replace state={{ from }} />;
  }

  return <Outlet />;
}
