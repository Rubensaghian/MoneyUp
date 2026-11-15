import { useCallback, useEffect, useRef, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { usePlaidLink } from 'react-plaid-link';
import type { PlaidLinkOnExit } from 'react-plaid-link';
import { postJson } from '../api/client';
import { getAccounts, refreshAccounts } from '../api/accounts';
import type { BankConnection, ConnectionSetupResponse } from '../api/accounts';
import BankConnectionCard from '../components/BankConnectionCard';

export default function AccountsPage() {
    const [linkToken, setLinkToken] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [isConnecting, setIsConnecting] = useState(false);
    const [connections, setConnections] = useState<BankConnection[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [notice, setNotice] = useState<{ severity: 'success' | 'warning'; message: string } | null>(null);
    const openedToken = useRef<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        getAccounts(controller.signal)
            .then(data => {
                if (!controller.signal.aborted) setConnections(data);
            })
            .catch(error => {
                if (!controller.signal.aborted) {
                    setError(error instanceof Error ? error.message : 'Could not load your accounts.');
                }
            })
            .finally(() => {
                if (!controller.signal.aborted) setIsLoading(false);
            });
        return () => controller.abort();
    }, []);

    const reloadSavedAccounts = useCallback(async () => {
        setConnections(await getAccounts());
    }, []);

    async function handleRefresh() {
        setError('');
        setNotice(null);
        setIsRefreshing(true);
        try {
            setConnections(await refreshAccounts());
            setNotice({ severity: 'success', message: 'Your saved account details have been updated.' });
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Could not refresh your accounts.');
            await reloadSavedAccounts().catch(() => undefined);
        } finally {
            setIsRefreshing(false);
        }
    }

    async function retrySavedAccounts() {
        setError('');
        setIsLoading(true);
        try {
            await reloadSavedAccounts();
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Could not load your accounts.');
        } finally {
            setIsLoading(false);
        }
    }

    async function initializeLink() {
        setError('');
        setNotice(null);
        setIsConnecting(true);
        setLinkToken(null);
        try {
            const data = await postJson<{ link_token: string }>('/generate_link_token');
            setLinkToken(data.link_token);
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Could not prepare the bank connection.');
            setIsConnecting(false);
        }
    }

    const handleLinkSuccess = useCallback(async (publicToken: string | null) => {
        if (!publicToken) {
            setError('The bank connection could not be completed. Please try again.');
            setIsConnecting(false);
            setLinkToken(null);
            return;
        }
        setError('');
        setIsSaving(true);
        try {
            const result = await postJson<ConnectionSetupResponse>('/swap_public_token', { public_token: publicToken });
            const initializationMessage = result.initialized
                ? ''
                : 'Bank linked, but some account or transaction data could not be loaded.';
            setNotice({
                severity: result.initialized ? 'success' : 'warning',
                message: initializationMessage || 'Your bank is connected and its accounts are saved.',
            });

            try {
                await reloadSavedAccounts();
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Please reload the page.';
                setError('Your bank is connected, but saved accounts could not be displayed. ' + message);
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Could not connect the bank.');
        } finally {
            setIsSaving(false);
            setIsConnecting(false);
            setLinkToken(null);
        }
    }, [reloadSavedAccounts]);

    const handleLinkExit = useCallback<PlaidLinkOnExit>((linkError) => {
        setIsConnecting(false);
        setLinkToken(null);
        if (linkError) setError(linkError.display_message || 'The bank connection could not be completed. Please try again.');
    }, []);

    const { open, ready, error: linkError } = usePlaidLink({
        token: linkToken, onSuccess: handleLinkSuccess, onExit: handleLinkExit,
    });

    useEffect(() => {
        if (ready && linkToken !== null && openedToken.current !== linkToken) {
            openedToken.current = linkToken;
            open();
        }
    }, [ready, linkToken, open]);

    const isLinkBusy = isConnecting && !linkError;
    const isBusy = isLoading || isLinkBusy || isRefreshing || isSaving;
    const accountCount = connections.reduce((count, connection) => count + connection.accounts.length, 0);

    return (
        <Container component="main" maxWidth="lg" id="AccountsPage" sx={{ my: { xs: 4, sm: 6 }, pb: 5 }}>
            <Stack component="header" direction={{ xs: 'column', md: 'row' }} spacing={2}
                sx={{ mb: 3, alignItems: { xs: 'flex-start', md: 'center' }, justifyContent: 'space-between' }}>
                <Box>
                    <Typography component="h1" variant="h4" sx={{ mb: 0.5, fontWeight: 600 }}>Accounts</Typography>
                    <Typography color="text.secondary">Your bank connections, with each account in one place.</Typography>
                </Box>
                <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                    <Button variant="outlined" color="success" disabled={isBusy || connections.length === 0}
                        loading={isRefreshing} onClick={handleRefresh}>Refresh accounts</Button>
                    <Button variant="contained" color="success" disabled={isBusy} loading={isLinkBusy || isSaving}
                        onClick={initializeLink} id="startLink">
                        {isSaving ? 'Saving connection…' : isLinkBusy ? 'Connecting…' : 'Connect bank'}
                    </Button>
                </Stack>
            </Stack>
            <Stack spacing={2} sx={{ mb: connections.length > 0 || error || notice || isLoading ? 3 : 0 }}>
                {error && <Alert severity="error" action={
                    <Button color="inherit" size="small" disabled={isBusy} onClick={retrySavedAccounts}>Reload list</Button>
                }>{error}</Alert>}
                {linkError && <Alert severity="error" action={
                    <Button color="inherit" size="small" onClick={() => window.location.reload()}>Reload page</Button>
                }>The bank connection window could not load. Reload the page and try again.</Alert>}
                {notice && <Alert severity={notice.severity} onClose={() => setNotice(null)}>{notice.message}</Alert>}
                {(isLoading || isSaving) && (
                    <Stack direction="row" spacing={1.5} role="status" sx={{ alignItems: 'center' }}>
                        <CircularProgress size={18} color="success" aria-hidden="true" />
                        <Typography variant="body2" color="text.secondary">
                            {isSaving ? 'Saving your bank connection…' : 'Loading your saved accounts…'}
                        </Typography>
                    </Stack>
                )}
                {connections.length > 0 && <Stack direction="row" spacing={1}>
                    <Chip variant="outlined" label={`${connections.length} bank ${connections.length === 1 ? 'connection' : 'connections'}`} />
                    <Chip variant="outlined" label={`${accountCount} ${accountCount === 1 ? 'account' : 'accounts'}`} />
                </Stack>}
            </Stack>
            {!isLoading && !error && connections.length === 0 && (
                <Paper variant="outlined" sx={{ p: { xs: 4, sm: 7 }, borderRadius: 3, textAlign: 'center' }}>
                    <Typography component="h2" variant="h5" sx={{ mb: 1 }}>Your accounts start here</Typography>
                    <Typography color="text.secondary" sx={{ maxWidth: 440, mx: 'auto', mb: 3 }}>
                        Connect a bank to see its checking, savings, and credit accounts grouped together.
                    </Typography>
                    <Button variant="contained" color="success" disabled={isBusy} onClick={initializeLink}>Connect your first bank</Button>
                </Paper>
            )}
            <Stack spacing={3} aria-busy={isRefreshing}>
                {connections.map((connection, index) => (
                    <BankConnectionCard key={connection.id} connection={connection} number={index + 1} />
                ))}
            </Stack>
        </Container>
    );
}
