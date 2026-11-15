import { useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { Link as RouterLink } from 'react-router-dom';
import { getTransactions } from '../api/transactions';
import type { AccountTransactions } from '../api/transactions';

const PAGE_SIZE = 25;

function formatDate(date: string): string {
    const value = new Date(`${date}T00:00:00Z`);
    if (Number.isNaN(value.getTime())) return 'Date unavailable';
    return value.toLocaleDateString(undefined, {
        month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
    });
}

function formatAmount(amount: number, currencyCode: string | null): string {
    const value = Math.abs(amount);
    if (currencyCode) {
        try {
            return new Intl.NumberFormat(undefined, { style: 'currency', currency: currencyCode }).format(value);
        } catch {
            // Plaid can return unofficial currency codes that Intl does not support.
        }
    }
    const formatted = value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return currencyCode ? `${formatted} ${currencyCode}` : formatted;
}

export default function TransactionsPage() {
    const [accounts, setAccounts] = useState<AccountTransactions[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [reloadVersion, setReloadVersion] = useState(0);
    const [search, setSearch] = useState('');
    const [accountId, setAccountId] = useState('');
    const [status, setStatus] = useState('all');
    const [page, setPage] = useState(1);

    useEffect(() => {
        const controller = new AbortController();
        getTransactions(controller.signal)
            .then(data => {
                if (!controller.signal.aborted) setAccounts(data);
            })
            .catch(error => {
                if (!controller.signal.aborted) {
                    setError(error instanceof Error ? error.message : 'Could not load your transactions.');
                }
            })
            .finally(() => {
                if (!controller.signal.aborted) setIsLoading(false);
            });
        return () => controller.abort();
    }, [reloadVersion]);

    function reloadTransactions() {
        setError('');
        setIsLoading(true);
        setReloadVersion(previous => previous + 1);
    }

    const transactions = (accounts ?? []).flatMap(account => account.transactions.map(transaction => ({
        ...transaction,
        accountId: account.accountId,
        accountName: account.name,
        accountSubtype: account.subtype,
    }))).sort((first, second) => second.date.localeCompare(first.date) || first.id.localeCompare(second.id));

    const query = search.trim().toLocaleLowerCase();
    const filtered = transactions.filter(transaction =>
        (!accountId || transaction.accountId === accountId)
        && (status === 'all' || (status === 'pending' ? transaction.pending : !transaction.pending))
        && (!query || `${transaction.merchantName ?? 'Bank transaction'} ${transaction.accountName}`
            .toLocaleLowerCase().includes(query)),
    );
    const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const currentPage = Math.min(page, pageCount);
    const firstRow = (currentPage - 1) * PAGE_SIZE;
    const visibleTransactions = filtered.slice(firstRow, firstRow + PAGE_SIZE);
    const hasFilters = Boolean(search || accountId || status !== 'all');

    function clearFilters() {
        setSearch('');
        setAccountId('');
        setStatus('all');
        setPage(1);
    }

    return (
        <Container component="main" id="TransactionsPage" maxWidth="lg" sx={{ my: { xs: 4, sm: 6 }, pb: 5 }}>
            <Stack component="header" direction={{ xs: 'column', sm: 'row' }} spacing={2}
                sx={{ mb: 3, alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between' }}>
                <Box>
                    <Typography component="h1" variant="h4" sx={{ mb: 0.5, fontWeight: 600 }}>Transactions</Typography>
                    <Typography color="text.secondary">Recent activity across your linked accounts.</Typography>
                </Box>
                <Button variant="contained" color="success" disabled={isLoading} onClick={reloadTransactions}
                    sx={{ flexShrink: 0 }}>
                    {isLoading ? 'Loading…' : 'Reload transactions'}
                </Button>
            </Stack>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error} Try reloading transactions.</Alert>}
            {isLoading && (
                <Stack direction="row" spacing={1.5} role="status" sx={{ mb: 2, alignItems: 'center' }}>
                    <CircularProgress size={18} color="success" aria-hidden="true" />
                    <Typography variant="body2" color="text.secondary">Loading your transactions…</Typography>
                </Stack>
            )}

            {accounts !== null && (
                <Paper component="section" variant="outlined" aria-label="Transaction activity" aria-busy={isLoading}
                    sx={{ borderRadius: 3, overflow: 'hidden' }}>
                    {transactions.length > 0 && (
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}
                            sx={{ p: 3, bgcolor: 'action.hover', borderBottom: 1, borderColor: 'divider' }}>
                            <TextField id="transaction-search" type="search" label="Search transactions"
                                placeholder="Search merchant or account" size="small" fullWidth value={search}
                                onChange={event => { setSearch(event.target.value); setPage(1); }}
                                sx={{ flex: 1 }} />
                            <TextField id="transaction-account" select label="Account" size="small" fullWidth
                                value={accountId} onChange={event => { setAccountId(event.target.value); setPage(1); }}
                                slotProps={{ inputLabel: { shrink: true }, select: { displayEmpty: true } }}
                                sx={{ width: { xs: '100%', md: 240 } }}>
                                <MenuItem value="">All accounts</MenuItem>
                                {accounts.map(account => (
                                    <MenuItem key={account.accountId} value={account.accountId}>
                                        {account.name}{account.subtype ? ` · ${account.subtype}` : ''}
                                    </MenuItem>
                                ))}
                            </TextField>
                            <TextField id="transaction-status" select label="Status" size="small" fullWidth
                                value={status} onChange={event => { setStatus(event.target.value); setPage(1); }}
                                sx={{ width: { xs: '100%', md: 170 } }}>
                                <MenuItem value="all">All statuses</MenuItem>
                                <MenuItem value="posted">Posted</MenuItem>
                                <MenuItem value="pending">Pending</MenuItem>
                            </TextField>
                        </Stack>
                    )}

                    {transactions.length === 0 ? (
                        <Stack spacing={2} sx={{ px: 3, py: 8, textAlign: 'center', alignItems: 'center' }}>
                            <Typography component="h2" variant="h6">
                                {accounts.length === 0 ? 'Connect your first bank' : 'No transactions yet'}
                            </Typography>
                            <Typography color="text.secondary" sx={{ maxWidth: 420 }}>{accounts.length === 0
                                ? 'Link a bank account to see your transactions here.'
                                : 'Your accounts are linked. Reload this page after your transactions become available.'}</Typography>
                            <Button component={RouterLink} to="/accounts" color="success">
                                {accounts.length === 0 ? 'Connect a bank' : 'View accounts'}
                            </Button>
                        </Stack>
                    ) : filtered.length === 0 ? (
                        <Stack spacing={2} sx={{ px: 3, py: 8, textAlign: 'center', alignItems: 'center' }}>
                            <Typography component="h2" variant="h6">No matching transactions</Typography>
                            <Typography color="text.secondary">Try another search or change your filters.</Typography>
                            <Button color="success" onClick={clearFilters}>Clear filters</Button>
                        </Stack>
                    ) : (
                        <>
                            <Stack direction="row" spacing={2}
                                sx={{ px: 3, py: 2, alignItems: 'center', justifyContent: 'space-between' }}>
                                <Typography variant="body2" color="text.secondary">
                                    {filtered.length.toLocaleString()} {filtered.length === 1 ? 'transaction' : 'transactions'}
                                    {hasFilters ? ` of ${transactions.length.toLocaleString()} total` : ''}
                                </Typography>
                                {hasFilters && <Button size="small" color="success" onClick={clearFilters}>Clear filters</Button>}
                            </Stack>
                            <TableContainer role="region" aria-label="Transactions table" tabIndex={0}>
                                <Table aria-label="Transactions, newest first" sx={{ minWidth: 690 }}>
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: 'action.hover' }}>
                                            <TableCell sortDirection="desc">Date</TableCell>
                                            <TableCell>Merchant</TableCell>
                                            <TableCell>Account</TableCell>
                                            <TableCell>Status</TableCell>
                                            <TableCell align="right">Amount</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {visibleTransactions.map(transaction => (
                                            <TableRow key={transaction.id} hover>
                                                <TableCell sx={{ whiteSpace: 'nowrap', color: 'text.secondary' }}>
                                                    <time dateTime={transaction.date}>{formatDate(transaction.date)}</time>
                                                </TableCell>
                                                <TableCell component="th" scope="row"
                                                    sx={{ maxWidth: 290, overflowWrap: 'anywhere', fontWeight: 600 }}>
                                                    {transaction.merchantName?.trim() || 'Bank transaction'}
                                                </TableCell>
                                                <TableCell>
                                                    {transaction.accountName}
                                                    {transaction.accountSubtype && (
                                                        <Typography variant="caption" color="text.secondary"
                                                            sx={{ display: 'block', textTransform: 'capitalize' }}>
                                                            {transaction.accountSubtype.replaceAll('_', ' ')}
                                                        </Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Chip size="small" variant="outlined"
                                                        color={transaction.pending ? 'warning' : 'success'}
                                                        label={transaction.pending ? 'Pending' : 'Posted'} />
                                                </TableCell>
                                                <TableCell align="right" sx={{
                                                    whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums',
                                                    color: transaction.amount < 0 ? 'success.main' : 'text.primary',
                                                }}>
                                                    {/* Plaid's positive amounts are outflows; display the direction for people. */}
                                                    <Typography component="span" variant="body2" sx={{ fontWeight: 600 }}>
                                                        {transaction.amount === 0 ? '' : transaction.amount < 0 ? '+' : '−'}{formatAmount(transaction.amount, transaction.currencyCode)}
                                                    </Typography>
                                                    {transaction.amount !== 0 && (
                                                        <Typography variant="caption" sx={{ display: 'block' }}
                                                            color={transaction.amount < 0 ? 'success.main' : 'text.secondary'}>
                                                            Money {transaction.amount < 0 ? 'in' : 'out'}
                                                        </Typography>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            <TablePagination component="div" count={filtered.length} rowsPerPage={PAGE_SIZE}
                                rowsPerPageOptions={[PAGE_SIZE]} page={currentPage - 1}
                                onPageChange={(_, nextPage) => setPage(nextPage + 1)} />
                        </>
                    )}
                </Paper>
            )}
        </Container>
    );
}
