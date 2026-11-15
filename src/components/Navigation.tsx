import { useState } from 'react';
import Alert from '@mui/material/Alert';
import AppBar from '@mui/material/AppBar';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import ListSubheader from '@mui/material/ListSubheader';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import SvgIcon from '@mui/material/SvgIcon';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { Link as RouterLink, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const pages = [
  { to: '/', label: 'Home' },
  { to: '/accounts', label: 'Accounts' },
  { to: '/transactions', label: 'Transactions' },
  { to: '/budget', label: 'Budgets' },
  { to: '/cashflow', label: 'Cash flow' },
];

export default function Navigation() {
  const { user, isLoading, signOut } = useAuth();
  const location = useLocation();
  const [error, setError] = useState('');
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  const handleLogout = async () => {
    if (isSigningOut) return;
    setMenuAnchor(null);
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
    <>
      <AppBar component="header" position="sticky" color="inherit" elevation={0}
        sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ minHeight: { xs: 64, sm: 72 }, gap: { xs: 1, sm: 3 } }}>
            <Button component={RouterLink} to="/" color="inherit" aria-label="MoneyUp home"
              sx={{ minWidth: 0, p: 0.5, gap: 1, textTransform: 'none', flexShrink: 0 }}>
              <Avatar variant="rounded" sx={{ width: 32, height: 32, bgcolor: 'success.main', fontSize: 20, fontWeight: 700 }}>M</Avatar>
              <Typography component="span" variant="h6" sx={{ fontWeight: 700, fontSize: { xs: 18, sm: 20 } }}>MoneyUp</Typography>
            </Button>
            {user && <Stack component="nav" aria-label="Main navigation" direction="row" spacing={0.5}
              sx={{ display: { xs: 'none', lg: 'flex' } }}>
              {pages.map(page => <Button key={page.to} component={NavLink} to={page.to} end={page.to === '/'} color="inherit"
                sx={{ textTransform: 'none', whiteSpace: 'nowrap', px: 1.5,
                  '&.active': { bgcolor: 'action.selected', color: 'success.dark', fontWeight: 600 } }}>
                {page.label}
              </Button>)}
            </Stack>}
            <Box sx={{ flexGrow: 1 }} />
            {isLoading && <Skeleton variant="rounded" width={120} height={32} />}
            {user && <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 0 }}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'action.selected', color: 'success.dark', fontSize: 14 }} aria-hidden="true">
                {user.username.charAt(0).toUpperCase()}
              </Avatar>
              <Typography variant="body2" title={user.username}
                sx={{ display: { xs: 'none', sm: 'block' }, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.username}
              </Typography>
              <Button color="inherit" variant="outlined" size="small" disabled={isSigningOut} onClick={handleLogout}
                sx={{ display: { xs: 'none', lg: 'inline-flex' }, textTransform: 'none', whiteSpace: 'nowrap' }}>
                {isSigningOut ? 'Logging out…' : 'Log out'}
              </Button>
              <IconButton color="inherit" aria-label="Open navigation menu" aria-haspopup="true"
                aria-controls={menuAnchor ? 'navigation-menu' : undefined} aria-expanded={menuAnchor ? true : undefined}
                onClick={event => setMenuAnchor(event.currentTarget)} sx={{ display: { lg: 'none' } }}>
                <SvgIcon><path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z" /></SvgIcon>
              </IconButton>
            </Stack>}
            {!isLoading && !user && <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
              <Button component={RouterLink} to="/login" color="inherit" size="small" sx={{ minWidth: 0, textTransform: 'none', whiteSpace: 'nowrap' }}>Log in</Button>
              <Button component={RouterLink} to="/signup" color="success" variant="contained" size="small" sx={{ minWidth: 0, textTransform: 'none', whiteSpace: 'nowrap' }}>Sign up</Button>
            </Stack>}
          </Toolbar>
        </Container>
      </AppBar>
      <Menu id="navigation-menu" anchorEl={menuAnchor} open={Boolean(menuAnchor) && user !== null}
        onClose={() => setMenuAnchor(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { minWidth: 230, mt: 1 } }, list: { 'aria-label': 'Main navigation' } }}>
        <ListSubheader>Signed in as {user?.username}</ListSubheader>
        {pages.map(page => <MenuItem key={page.to} component={RouterLink} to={page.to}
          selected={location.pathname === page.to} aria-current={location.pathname === page.to ? 'page' : undefined}
          onClick={() => setMenuAnchor(null)}>{page.label}</MenuItem>)}
        <Divider />
        <MenuItem disabled={isSigningOut} onClick={handleLogout}>{isSigningOut ? 'Logging out…' : 'Log out'}</MenuItem>
      </Menu>
      {error && <Alert severity="error" onClose={() => setError('')} sx={{ borderRadius: 0 }}>{error}</Alert>}
    </>
  );
}
