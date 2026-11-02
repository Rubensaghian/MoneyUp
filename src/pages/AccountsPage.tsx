import { useCallback, useEffect, useState } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { postJson } from '../api/client';
import { getAccounts, refreshAccounts } from '../api/accounts';
import type { BankConnection } from '../api/accounts';

function formatBalance(value: number | null, currency: string | null): string {
    if (value === null) return 'Unavailable';
    if (currency) {
        try {
            return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value);
        } catch {
            return value.toLocaleString() + ' ' + currency;
        }
    }
    return value.toLocaleString();
}

export default function AccountsPage() {
    const [linkToken, setLinkToken] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [isPreparing, setIsPreparing] = useState(false);
    const [connections, setConnections] = useState<BankConnection[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const isBusy = isLoading || isPreparing || isRefreshing || isSaving;

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
        try {
            setConnections(await getAccounts());
        } catch {
            // Keep the current list and the error from the refresh that failed.
        }
    }, []);

    async function handleRefresh() {
        setError('');
        setIsRefreshing(true);
        try {
            setConnections(await refreshAccounts());
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Could not refresh your accounts.');
            await reloadSavedAccounts();
        } finally {
            setIsRefreshing(false);
        }
    }

    async function initializeLink() {
        setError('');
        setIsPreparing(true);
        try {
            const data = await postJson<{ link_token: string }>('/generate_link_token');
            setLinkToken(data.link_token);
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Could not prepare the bank connection.');
        } finally {
            setIsPreparing(false);
        }
    }

    const handleLinkSuccess = useCallback(async (publicToken: string | null) => {
        if (!publicToken) return;
        setError('');
        setIsSaving(true);
        try {
            await postJson<{ connection_id: string }>('/swap_public_token', { public_token: publicToken });
            try {
                setConnections(await refreshAccounts());
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Please refresh your accounts.';
                setError('Bank linked, but account details could not be refreshed. ' + message);
                await reloadSavedAccounts();
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Could not connect the bank.');
        } finally {
            setIsSaving(false);
            setLinkToken(null);
        }
    }, [reloadSavedAccounts]);

    const { open, ready } = usePlaidLink({ token: linkToken, onSuccess: handleLinkSuccess });

    return (
        <div className="PageLink" id="AccountsPage"> 
            <h1>Accounts</h1>
            {error && <p role="alert">{error}</p>}
            <button disabled={isBusy} onClick={initializeLink} id="startLink">
                {isPreparing ? 'Preparing…' : 'Prepare connection'}
            </button>
            <button disabled={!ready || isBusy} onClick={() => open()}>Connect Bank</button>
            <button disabled={!ready || isBusy} onClick={handleRefresh}>
                {isRefreshing ? 'Refreshing…' : 'Refresh accounts'}
            </button>
            {isLoading && <p role="status">Loading saved accounts…</p>}
            {isSaving && <p role="status">Saving your bank connection…</p>}
            {!isLoading && !error && connections.length === 0 && (
                <p>No banks linked yet. Connect a bank to see your accounts.</p>
            )}
            {connections.map(connection => (
                <section key={connection.id} aria-label={connection.institutionName ?? 'Linked bank'}>
                    <h2>{connection.institutionName ?? 'Linked bank'}</h2>
                    {connection.accountsLastFetchedAt && (
                        <p>Details retrieved {new Date(connection.accountsLastFetchedAt).toLocaleString()}</p>
                    )}
                    {connection.accounts.length === 0 && (
                        <p>{connection.accountsLastFetchedAt
                            ? 'No active accounts were returned for this bank.'
                            : 'Account details have not been loaded yet. Refresh accounts to load them.'}</p>
                    )}
                    <ul>
                        {connection.accounts.map(account => (
                            <li key={account.id}>
                                <h3>{account.name}{account.mask ? ' •••• ' + account.mask : ''}</h3>
                                {(account.subtype || account.type) && <p>{account.subtype ?? account.type}</p>}
                                <p>Current balance: {formatBalance(account.currentBalance, account.currencyCode)}</p>
                                {account.availableBalance !== null && (
                                    <p>Available balance: {formatBalance(account.availableBalance, account.currencyCode)}</p>
                                )}
                            </li>
                        ))}
                    </ul>
                </section>
            ))}
        </div>
    );
}
